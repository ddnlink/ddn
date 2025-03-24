import { bignum } from '@ddn/utils';

export class ForgeManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.logger = ctx.logger;
        this.runtime = ctx.runtime;
        this.constants = ctx.constants;
    }

    async startForgeBlockTask() {
        const executeForgingProcess = async () => {
            if (!this.shouldProceedWithForging()) return;
            const currentSlot = this.runtime.slot.getSlotNumber();
            const lastBlock = this.runtime.block.getLastBlock();

            if (this.isInvalidSlot(currentSlot, lastBlock)) return;

            try {
                const delegateInfo = await this.getDelegateInfo(currentSlot, lastBlock);
                if (!delegateInfo) return;
                await this.attemptBlockGeneration(delegateInfo);
            } catch (err) {
                this.handleGenerationError(err);
            }
        };

        await executeForgingProcess();
        this.scheduleNextExecution();
    }

    shouldProceedWithForging() {
        const { stateMachine, delegate } = this.runtime;

        if (!stateMachine.isReady()) return false;
        if (!delegate.isForgeEnabled()) {
            this.logger.trace('Loop: Forging disabled');
            return false;
        }
        if (!delegate.hasValidDelegates()) {
            this.logger.trace('Loop: No valid delegates');
            return false;
        }
        return true;
    }

    isInvalidSlot(currentSlot, lastBlock) {
        const constants = this.constants;
        const slotMatches = currentSlot === this.runtime.slot.getSlotNumber(lastBlock.timestamp);
        const timeThreshold = Date.now() % (constants.interval * 1000) > (constants.interval * 1000) / 2;

        if (slotMatches) this.logger.trace('Loop: Last block in same slot');
        if (timeThreshold) this.logger.trace('Loop: Late for vote collection');

        return slotMatches || timeThreshold;
    }

    async getDelegateInfo(currentSlot, lastBlock) {
        const nextHeight = bignum.plus(lastBlock.height, 1);
        this.logger.debug(`Fetching delegate info for slot ${currentSlot}, height ${nextHeight}`);

        return this.runtime.delegate.getForgeDelegateWithCurrentTime(
            currentSlot,
            nextHeight
        );
    }

    async attemptBlockGeneration(delegateInfo) {
        await this.ctx.sequence.addAsync(async () => {
            const slotValid = this.runtime.slot.getSlotNumber(delegateInfo.time) ===
                this.runtime.slot.getSlotNumber();
            const timestampValid = this.runtime.block.getLastBlock().timestamp < delegateInfo.time;

            if (slotValid && timestampValid) {
                await this.runtime.block.generateBlock(delegateInfo.keypair, delegateInfo.time);
            }
        });
    }

    handleGenerationError(err) {
        const errorMessage = `Block generation failed: ${err.message}`;
        this.logger.error(errorMessage);

        if (err.message.includes('Forged new block failed')) {
            this.logger.debug('Block generation failure details:', err);
        }
    }

    scheduleNextExecution() {
        setTimeout(() => this.startForgeBlockTask(), 100);
    }
}