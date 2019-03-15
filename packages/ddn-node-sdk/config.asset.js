exports.evidence = {
    transactions: [
        {
            name: "AssetEvidence",
            type: 10,
        }
    ],
    package: "ddn-evidence"
}
exports.signature = {
    transactions: [
        {
            name: "Signature",
            type: 1,
        }
    ],
    package: "ddn-signature"
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
            name: "AobAcl",
            type: 79,
        },
        {
            name: "AobFlag",
            type: 80,
        }
    ],
    package: "ddn-aob"
}