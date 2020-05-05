// import DdnCrypto from "@ddn/crypto";
import ddn from "../";
import node from "../lib/test";
import slots from "../lib/time/slots";

const expect = node.expect;

describe("Node SDK", () => {

	it("should be ok", () => {
		// (ddn).to.be.ok;
		expect(ddn).to.be.ok
	});

	it("should be object", () => {
		expect(ddn).that.is.an("object");
	});

	it("should have properties", () => {
		const properties = ["transaction", "signature", "vote", "delegate", "dapp", "crypto"];

		properties.forEach(property => {
			expect(ddn).to.have.property(property);
		});
	});

	describe("dapp.js", () => {
		const dapp = ddn.dapp;

		it("should be object", () => {
			expect(dapp).that.is.an("object");
		});

		it("should have properties", () => {
			expect(dapp).to.have.property("createDApp");
		})

		describe("#createDApp", () => {
			const createDApp = dapp.createDApp;
			let trs = null;

			const options = {
				"name": "ddn-dapp-demo",
				"link": "https://github.com/ddnlink/ddn-dapp-demo/archive/master.zip",
				"category": 1,
				"description": "Decentralized news channel",
				"tags": "ddn,dapp,demo",
				"icon": "http://o7dyh3w0x.bkt.clouddn.com/hello.png",
				"type": 0,
				"delegates": [
					"8b1c24a0b9ba9b9ccf5e35d0c848d582a2a22cca54d42de8ac7b2412e7dc63d4",
					"aa7dcc3afd151a549e826753b0547c90e61b022adb26938177904a73fc4fee36",
					"e29c75979ac834b871ce58dc52a6f604f8f565dea2b8925705883b8c001fe8ce",
					"55ad778a8ff0ce4c25cb7a45735c9e55cf1daca110cfddee30e789cb07c8c9f3",
					"982076258caab20f06feddc94b95ace89a2862f36fea73fa007916ab97e5946a"
				],
				"unlockDelegates": 3
			};

			it("should be a function", () => {
				expect(createDApp).to.be.a("function");
			});

			it("should create dapp without second signature", () => {
				trs = createDApp(options, "secret", null);
				expect(trs).to.be.ok;
			});

			it("should create delegate with second signature", () => {
				trs = createDApp(options, "secret", "secret 2");
				expect(trs).to.be.ok;
			});

			describe("returned dapp", () => {
				const secondKeys = ddn.crypto.getKeys("secret 2");

				it("should be object", () => {
					expect(trs).that.is.an("object");
				});

				it("should have id as string", () => {
					expect(trs.id).to.be.a("string");
				});

				it("should have type as number and equal 9", () => {
					expect(trs.type).to.be.a("number").to.equal(5);
				});

				it("should have amount as number and eqaul 0", () => {
					expect(trs.amount).to.be.a("number").to.equal(0);
				});

				it("should have fee as number and equal 10000000000", () => {
                    //Bignum update (trs.fee).to.be.a("number").to.equal(10000000000);
                    expect(trs.fee).to.be.a("string").to.equal("10000000000");
				});

				it("should have null recipientId", () => {
					expect(trs).to.have.property("recipientId").equal(null);
				});

				it("should have senderPublicKey as hex string", () => {
					(trs.senderPublicKey).to.be.a("string").and.match(() => {
						try {
							Buffer.from(trs.senderPublicKey, "hex")
						} catch (e) {
							return false;
						}

						return true;
					})
				});

				it("should have timestamp as number", () => {
					expect(trs.timestamp).to.be.a("number").and.not.NaN;
				});

				it("should have dapp inside asset", () => {
					expect(trs.asset).to.have.property("dapp");
				});

				describe("dapp asset", () => {
					it("should be ok", () => {
						expect(trs.asset.dapp).to.be.ok;
					})

					it("should be object", () => {
						expect(trs.asset.dapp).that.is.an("object");
					});

					it("should have category property", () => {
						expect(trs.asset.dapp).to.have.property("category").to.equal(options.category);
					});

					it("should have name property", () => {
						expect(trs.asset.dapp).to.have.property("name").to.equal(options.name);
					});

					it("should have tags property", () => {
						(expecttrs.asset.dapp).to.have.property("tags").to.equal(options.tags);
					});

					it("should have type property", () => {
						expect(trs.asset.dapp).to.have.property("type").to.equal(options.type);
					});

					it("should have link property", () => {
						expect(trs.asset.dapp).to.have.property("link").to.equal(options.link);
					});

					it("should have icon property", () => {
						expect(trs.asset.dapp).to.have.property("icon").to.equal(options.icon);
					});
				});

				it("should have signature as hex string", () => {
					(trs.signature).to.be.a("string").and.match(() => {
						try {
							Buffer.from(trs.signature, "hex")
						} catch (e) {
							return false;
						}

						return true;
					})
				});

				it("should have second signature in hex", () => {
					(trs).to.have.property("signSignature").and.type("string").and.match(() => {
						try {
							Buffer.from(trs.signSignature, "hex");
						} catch (e) {
							return false;
						}

						return true;
					});
				});

				it("should be signed correctly", () => {
					const result = ddn.crypto.verify(trs);
					expect(result).to.be.ok;
				});

				it("should not be signed correctly now", () => {
					trs.amount = "10000";   //Bignum update
					const result = ddn.crypto.verify(trs);
					expect(result).to.be.not.ok;
				});

				it("should be second signed correctly", () => {
					trs.amount = "0";   //Bignum update
					const result = ddn.crypto.verifySecondSignature(trs, secondKeys.publicKey);
					expect(result).to.be.ok;
				});

				it("should not be second signed correctly now", () => {
					trs.amount = "10000";   //Bignum update
					const result = ddn.crypto.verifySecondSignature(trs, secondKeys.publicKey);
					expect(result).to.be.not.ok;
				});

				it("should be ok to verify bytes", () => {
					const data1 = 'a1b2c3d4';
					const secret = 'secret1';
					const keys = ddn.crypto.getKeys(secret);
					let signature = ddn.crypto.signBytes(data1, keys);
					let result = ddn.crypto.verifyBytes(data1, signature, keys.publicKey);
					expect(result).to.be.ok

					const data2 = Buffer.from('a1b2c3d4', 'hex');
					signature = ddn.crypto.signBytes(data2, keys)
					result = ddn.crypto.verifyBytes(data2, signature, keys.publicKey)
					expect(result).to.be.ok
				})
			});
		});
	});

	describe("delegate.js", () => {
		const delegate = ddn.delegate;

		it("should be ok", () => {
			expect(delegate).to.be.ok;
		});

		it("should be function", () => {
			expect(delegate).that.is.an("object");
		});

		it("should have property createDelegate", () => {
			expect(delegate).to.have.property("createDelegate");
		});

		describe("#createDelegate", () => {
			const createDelegate = delegate.createDelegate;
			let trs = null;

			it("should be ok", () => {
				expect(createDelegate).to.be.ok;
			});

			it("should be function", () => {
				expect(createDelegate).to.be.a("function");
			});

			it("should create delegate", () => {
				trs = createDelegate("delegate", "secret", "secret 2");
		
				const keys = ddn.crypto.getKeys("secret");
				const secondKeys = ddn.crypto.getKeys("secret 2");

				it("should be ok", () => {
					expect(trs).to.be.ok;
				});

				it("should be object", () => {
					expect(trs).that.is.an("object");
				});

				it("should have recipientId equal null", () => {
					expect(trs).to.have.property("recipientId").that.is.an("object").to.be.empty;
				})

				it("shoud have amount equal 0", () => {
					expect(trs).to.have.property("amount").and.type("number").to.equal(0);
				})

				it("should have type equal 0", () => {
					expect(trs).to.have.property("type").and.type("number").to.equal(2);
				});

				it("should have timestamp number", () => {
					expect(trs).to.have.property("timestamp").and.type("number");
				});

				it("should have senderPublicKey in hex", () => {
					expect(trs).to.have.property("senderPublicKey").and.type("string").and.match(() => {
						try {
							Buffer.from(trs.senderPublicKey, "hex");
						} catch (e) {
							return false;
						}

						return true;
					}).to.equal(keys.publicKey);
				});

				it("should have signature in hex", () => {
					expect(trs).to.have.property("signature").to.be.a("string").and.match(() => {
						try {
							Buffer.from(trs.signature, "hex");
						} catch (e) {
							return false;
						}

						return true;
					});
				});

				it("should have second signature in hex", () => {
					expect(trs).to.have.property("signSignature").to.be.a("string").and.match(() => {
						try {
							Buffer.from(trs.signSignature, "hex");
						} catch (e) {
							return false;
						}

						return true;
					});
				});

				it("should have delegate asset", () => {
					expect(trs).to.have.property("asset").that.is.an("object");
					expect(trs.asset).to.have.property("delegate");
				})

				it("should be signed correctly", () => {
					const result = ddn.crypto.verify(trs, keys.publicKey);
					expect(result).to.be.ok;
				});

				it("should be second signed correctly", () => {
					const result = ddn.crypto.verifySecondSignature(trs, secondKeys.publicKey);
					expect(result).to.be.ok;
				});

				it("should not be signed correctly now", () => {
					trs.amount = "100"; //Bignum update
					const result = ddn.crypto.verify(trs, keys.publicKey);
					expect(result).to.be.not.ok;
				});

				it("should not be second signed correctly now", () => {
					trs.amount = "100"; //Bignum update
					const result = ddn.crypto.verify(trs, secondKeys.publicKey);
					expect(result).to.be.not.ok;
				});

				describe("delegate asset", () => {
					it("should be ok", () => {
						expect(trs.asset.delegate).to.be.ok;
					});

					it("should be object", () => {
						expect(trs.asset.delegate).that.is.an("object");
					});

					it("should be have property username", () => {
						expect(trs.asset.delegate).to.have.property("username").to.be.a("string").to.equal("delegate");
					});
				});
			});
		});
	});

	describe("multisignature.js", () => {
	});

	describe("signature.js", () => {
		const signature = ddn.signature;
		it("should be ok", () => {
			expect(signature).to.be.ok;
		});

		it("should be object", () => {
			expect(signature).that.is.an("object");
		});

		it("should have properties", () => {
			expect(signature).to.have.property("createSignature");
		});

		describe("#createSignature", () => {
			const createSignature = signature.createSignature;
			let sgn = null;

			it("should be function", () => {
				expect(createSignature).to.be.a("function");
			});

			it("should create signature transaction", () => {
				sgn = createSignature("secret", "second secret");
				expect(sgn).to.be.ok;
				expect(sgn).that.is.an("object");
			});

			describe("returned signature transaction", () => {
				it("should have empty recipientId", () => {
					expect(sgn).to.have.property("recipientId").equal(null);
				});

				it("should have amount equal 0", () => {
					expect(sgn.amount).to.be.a("number").equal(0);
				});

				it("should have asset", () => {
					expect(sgn.asset).that.is.an("object");
					expect(sgn.asset).to.be.not.empty;
				});

				it("should have signature inside asset", () => {
					expect(sgn.asset).to.have.property("signature");
				});

				describe("signature asset", () => {
					it("should be ok", () => {
						expect(sgn.asset.signature).to.be.ok;
					})

					it("should be object", () => {
						expect(sgn.asset.signature).that.is.an("object");
					});

					it("should have publicKey property", () => {
						expect(sgn.asset.signature).to.have.property("publicKey");
					});

					it("should have publicKey in hex", () => {
						expect(sgn.asset.signature.publicKey).to.be.a("string").and.match(() => {
							try {
								Buffer.from(sgn.asset.signature.publicKey);
							} catch (e) {
								return false;
							}

							return true;
						});
					});

					it("should have publicKey in 32 bytes", () => {
						const publicKey = Buffer.from(sgn.asset.signature.publicKey, "hex");
						expect(publicKey.length).to.equal(32);
					});
				});
			});
		});
	});

	describe("slots.js", () => {

		it("should be ok", () => {
			expect(slots).to.be.ok;
		});

		it("should be object", () => {
			expect(slots).that.is.an("object");
		});

		it("should have properties", () => {
			const properties = ["interval", "delegates", "getTime", "getRealTime", "getSlotNumber", "getSlotTime", "getNextSlot", "getLastSlot"];
			properties.forEach(property => {
				expect(slots).to.have.property(property);
			});
		});

		describe(".interval", () => {
			const interval = slots.interval;

			it("should be ok", () => {
				expect(interval).to.be.ok;
			});

			it("should be number and not NaN", () => {
				expect(interval).to.be.a("number").and.not.NaN;
			});
		});

		describe(".delegates", () => {
			const delegates = slots.delegates;

			it("should be ok", () => {
				expect(delegates).to.be.ok;
			});

			it("should be number and not NaN", () => {
				expect(delegates).to.be.a("number").to.be.not.NaN;
			});
		});

		describe("#getTime", () => {
			const getTime = slots.getTime;

			it("should be ok", () => {
				expect(getTime).to.be.ok;
			});

			it("should be a function", () => {
				expect(getTime).to.be.a("function");
			});

			it("should return epoch time as number, equal to 2764800", () => {
				const d = 1469822400000;
				const time = getTime(d);
				expect(time).to.be.ok;
				expect(time).to.be.a("number").to.equal(2764800);
			});
		});

		describe("#getRealTime", () => {
			const getRealTime = slots.getRealTime;

			it("should be ok", () => {
				expect(getRealTime).to.be.ok;
			});

			it("should be a function", () => {
				expect(getRealTime).to.be.a("function");
			});

			it("should return return real time, convert 196144 to 1467253744000", () => {
				const d = 196144;
				const real = getRealTime(d);
				expect(real).to.be.ok;
				expect(real).to.be.a("number").to.equal(1467253744000);
			});
		});

		describe("#getSlotNumber", () => {
			const getSlotNumber = slots.getSlotNumber;

			it("should be ok", () => {
				expect(getSlotNumber).to.be.ok;
			});

			it("should be a function", () => {
				expect(getSlotNumber).to.be.a("function");
			});

			it("should return slot number, equal to 19614", () => {
				const d = 196144;
				const slot = getSlotNumber(d);
				expect(slot).to.be.ok;
				expect(slot).to.be.a("number").to.equal(19614);
			});
		});

		describe("#getSlotTime", () => {
			const getSlotTime = slots.getSlotTime;

			it("should be ok", () => {
				expect(getSlotTime).to.be.ok;
			});

			it("should be function", () => {
				expect(getSlotTime).to.be.a("function");
			});

			it("should return slot time number, equal to ", () => {
				const slotTime = getSlotTime(19614);
				expect(slotTime).to.be.ok;
				expect(slotTime).to.be.a("number").to.equal(196140);
			});
		});

		describe("#getNextSlot", () => {
			const getNextSlot = slots.getNextSlot;

			it("should be ok", () => {
				expect(getNextSlot).to.be.ok;
			});

			it("should be function", () => {
				expect(getNextSlot).to.be.a("function");
			});

			it("should return next slot number", () => {
				const nextSlot = getNextSlot();
				expect(nextSlot).to.be.ok;
				expect(nextSlot).to.be.a("number").to.be.not.NaN;
			});
		});

		describe("#getLastSlot", () => {
			const getLastSlot = slots.getLastSlot;

			it("should be ok", () => {
				expect(getLastSlot).to.be.ok;
			});

			it("should be function", () => {
				expect(getLastSlot).to.be.a("function");
			});

			it("should return last slot number", () => {
				const lastSlot = getLastSlot(slots.getNextSlot());
				expect(lastSlot).to.be.ok;
				expect(lastSlot).to.be.a("number").to.by.not.NaN;
			});
		});
	});

	describe("transaction.js", () => {
		const transaction = ddn.transaction;

		it("should be object", () => {
			expect(transaction).that.is.an("object");
		});

		it("should have properties", () => {
			expect(transaction).to.have.property("createTransaction");
		})

		describe("#createTransaction", () => {
			const createTransaction = transaction.createTransaction;
			let trs = null;

			it("should be a function", () => {
				expect(createTransaction).to.be.a("function");
			});

			it("should create transaction without second signature", () => {
				trs = createTransaction("58191285901858109", 1000, "", "secret");
				expect(trs).to.be.ok;
			});

			describe("returned transaction", () => {
				it("should be object", () => {
					expect(trs).that.is.an("object");
				});

				it("should have id as string", () => {
					expect(trs.id).to.be.a("string");
				});

				it("should have type as number and eqaul 0", () => {
					expect(trs.type).to.be.a("number").to.equal(0);
				});

				it("should have timestamp as number", () => {
					expect(trs.timestamp).to.be.a("number").to.be.not.NaN;
				});

				it("should have senderPublicKey as hex string", () => {
					(trs.senderPublicKey).to.be.a("string").and.match(() => {
						try {
							Buffer.from(trs.senderPublicKey, "hex")
						} catch (e) {
							return false;
						}

						return true;
					})
				});

				it("should have recipientId as string and to be equal 58191285901858109", () => {
					expect(trs.recipientId).to.be.a("string").to.equal("58191285901858109");
				});

				it("should have amount as number and eqaul to 1000", () => {
					expect(trs.amount).to.be.a("number").to.equal(1000);
				});

				it("should have empty asset object", () => {
					expect(trs.asset).that.is.an("object").to.be.empty;
				});

				it("should does not have second signature", () => {
					expect(trs).should.not.have.property("signSignature");
				});

				it("should have signature as hex string", () => {
					expect(trs.signature).to.be.a("string").and.match(() => {
						try {
							Buffer.from(trs.signature, "hex")
						} catch (e) {
							return false;
						}

						return true;
					})
				});

				it("should be signed correctly", () => {
					const result = ddn.crypto.verify(trs);
					expect(result).to.be.ok;
				});

				it("should not be signed correctly now", () => {
					trs.amount = "10000";   //Bignum update
					const result = ddn.crypto.verify(trs);
					expect(result).to.be.not.ok;
				});
			});
		});

		describe("#createTransaction with second secret", () => {
			const createTransaction = transaction.createTransaction;
			let trs = null;
			const secondSecret = "second secret";
			const keys = ddn.crypto.getKeys(secondSecret);

			it("should be a function", () => {
				expect(createTransaction).to.be.a("function");
			});

			it("should create transaction without second signature", () => {
				trs = createTransaction("58191285901858109", 1000, "", "secret", secondSecret);
				expect(trs).to.be.ok;
			});

			describe("returned transaction", () => {
				it("should be object", () => {
					expect(trs).that.is.an("object");
				});

				it("should have id as string", () => {
					expect(trs.id).to.be.a("string");
				});

				it("should have type as number and eqaul 0", () => {
					expect(trs.type).to.be.a("number").to.equal(0);
				});

				it("should have timestamp as number", () => {
					expect(trs.timestamp).to.be.a("number").and.not.NaN;
				});

				it("should have senderPublicKey as hex string", () => {
					expect(trs.senderPublicKey).to.be.a("string").and.match(() => {
						try {
							Buffer.from(trs.senderPublicKey, "hex")
						} catch (e) {
							return false;
						}

						return true;
					})
				});

				it("should have recipientId as string and to be equal 58191285901858109", () => {
					expect(trs.recipientId).to.be.a("string").to.equal("58191285901858109");
				});

				it("should have amount as number and eqaul to 1000", () => {
					expect(trs.amount).to.be.a("number").to.equal(1000);
				});

				it("should have empty asset object", () => {
					expect(trs.asset).that.is.an("object").to.be.empty;
				});

				it("should have second signature", () => {
					expect(trs).to.have.property("signSignature");
				});

				it("should have signature as hex string", () => {
					expect(trs.signature).to.be.a("string").and.match(() => {
						try {
							Buffer.from(trs.signature, "hex")
						} catch (e) {
							return false;
						}

						return true;
					})
				});

				it("should have signSignature as hex string", () => {
					expect(trs.signSignature).to.be.a("string").and.match(() => {
						try {
							Buffer.from(trs.signSignature, "hex");
						} catch (e) {
							return false;
						}

						return true;
					});
				});

				it("should be signed correctly", () => {
					const result = ddn.crypto.verify(trs);
					expect(result).to.be.ok;
				});

				it("should be second signed correctly", () => {
					const result = ddn.crypto.verifySecondSignature(trs, keys.publicKey);
					expect(result).to.be.ok;
				});

				it("should not be signed correctly now", () => {
					trs.amount = "10000";   //Bignum update
					const result = ddn.crypto.verify(trs);
					expect(result).to.be.not.ok;
				});

				it("should not be second signed correctly now", () => {
					trs.amount = "10000";   //Bignum update
					const result = ddn.crypto.verifySecondSignature(trs, keys.publicKey);
					expect(result).to.be.not.ok;
				});
			});
		});
	});

	describe("transfer.js", () => {
	});

	describe("vote.js", () => {
		const vote = ddn.vote;

		it("should be ok", () => {
			expect(vote).to.be.ok;
		});

		it("should be object", () => {
			expect(vote).that.is.an("object");
		});

		it("should have createVote property", () => {
			expect(vote).to.have.property("createVote");
		});

		describe("#createVote", () => {
            const createVote = vote.createVote;
            let vt = null;
            const publicKey = ddn.crypto.getKeys("secret").publicKey;
            const publicKeys = [`+${publicKey}`];

            it("should be ok", () => {
				expect(createVote).to.be.ok;
			});

            it("should be function", () => {
				expect(createVote).to.be.a("function");
			});

            describe("should create vote", () => {
				vt = createVote(publicKeys, "secret", "second secret");
	
				it("should be ok", () => {
					expect(vt).to.be.ok;
				});

				it("should be object", () => {
					expect(vt).that.is.an("object");
				});

				it("should have recipientId string equal to sender", () => {
					expect(vt).to.have.property("recipientId").equal(null);
				});

				it("should have amount number eaul to 0", () => {
					expect(vt).to.have.property("amount").and.be.type("number").to.equal(0);
				});

				it("should have type number equal to 3", () => {
					expect(vt).to.have.property("type").and.be.type("number").to.equal(3);
				});

				it("should have timestamp number", () => {
					expect(vt).to.have.property("timestamp").and.be.type("number");
				});

				it("should have senderPublicKey hex string equal to sender public key", () => {
					expect(vt).to.have.property("senderPublicKey").and.be.type("string").and.match(() => {
						try {
							Buffer.from(vt.senderPublicKey, "hex");
						} catch (e) {
							return false;
						}

						return true;
					}).to.equal(publicKey);
				});

				it("should have signature hex string", () => {
					expect(vt).to.have.property("signature").and.be.type("string").and.match(() => {
						try {
							Buffer.from(vt.signature, "hex");
						} catch (e) {
							return false;
						}

						return true;
					});
				});

				it("should have second signature hex string", () => {
					expect(vt).to.have.property("signSignature").and.be.type("string").and.match(() => {
						try {
							Buffer.from(vt.signSignature, "hex");
						} catch (e) {
							return false;
						}

						return true;
					});
				});

				it("should be signed correctly", () => {
					const result = ddn.crypto.verify(vt);
					expect(result).to.be.ok;
				});

				it("should be second signed correctly", () => {
					const result = ddn.crypto.verifySecondSignature(vt, ddn.crypto.getKeys("second secret").publicKey);
					expect(result).to.be.ok;
				});

				it("should not be signed correctly now", () => {
					vt.amount = "100";  //Bignum update
					const result = ddn.crypto.verify(vt);
					expect(result).to.be.not.ok;
				});

				it("should not be second signed correctly now", () => {
					vt.amount = "100";  //Bignum update
					const result = ddn.crypto.verifySecondSignature(vt, ddn.crypto.getKeys("second secret").publicKey);
					expect(result).to.be.not.ok;
				});

				it("should have asset", () => {
					expect(vt).to.have.property("asset").and.not.empty;
				});

				describe("vote asset", () => {
					it("should be ok", () => {
						expect(vt.asset.vote).to.have.property("votes").and.be.ok;
					});

					it("should be object", () => {
						expect(vt.asset.vote.votes).that.is.an("object");
					});

					it("should be not empty", () => {
						expect(vt.asset.vote.votes).to.be.not.empty;
					});

					it("should contains one element", () => {
						expect(vt.asset.vote.votes.length).to.equal(1);
					});

					it("should have public keys in hex", () => {
						vt.asset.vote.votes.forEach(v => {
							expect(v).to.be.a("string").startWith("+").and.match(() => {
								try {
									Buffer.from(v.substring(1, v.length), "hex");
								} catch (e) {
									return false;
								}

								return true;
							});
						});
					});

					it("should be equal to sender public key", () => {
						const v = vt.asset.vote.votes[0];
						expect(v.substring(1, v.length)).to.equal(publicKey);
					});
				})
			});
        });
	});

});
