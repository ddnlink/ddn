exports.evidence = {
    transactions: [
        {
            name: "Evidence",
            type: 10,
        }
    ],
    package: "ddn-evidence"
}
exports.aob = {
    transactions: [
        {
            name: "AobIssuer",
            type: 60,
        },
        {
            name: "AobAsset",
            type: 61,
        },
        {
            name: "AobIssue",
            type: 64,
        },
        {
            name: "AobTransfer",
            type: 65,
        },
    ],
    package: "ddn-aob"
}
exports.dao = {
    transactions: [
        {
            name: "Org",
            type: 40,
        },
        {
            name: "Exchange",
            type: 41,
        },
        {
            name: "Contribution",
            type: 42,
        },
        {
            name: "Confirmation",
            type: 43,
        },
    ],
    package: "ddn-dao"
}
exports.tmnevidence = {
    transactions: [
        {
            name: "TmnEvidence",
            type: 71,
        },
    ],
    package: "ddn-tmn-evidence"
}