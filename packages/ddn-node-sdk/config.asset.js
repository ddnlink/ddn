exports.evidence = {
    transactions: [
        {
            name: "AssetEvidence",
            type: 10,
        }
    ],
    package: "ddn-evidence"
}
exports.aob = {
    transactions: [
        {
            name: "AobIssuer",
            type: 75,
        },
        {
            name: "AobAsset",
            type: 76,
        },
        {
            name: "AobIssue",
            type: 77,
        },
        {
            name: "AobTransfer",
            type: 78,
        },
        {
            name: "MemAssetBalance",
            type: 79,
        },
    ],
    package: "ddn-aob"
}