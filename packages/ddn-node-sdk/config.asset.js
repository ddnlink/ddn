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