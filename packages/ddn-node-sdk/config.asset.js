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
            name: "Issuer",
            type: 60,
        },
        {
            name: "Asset",
            type: 61,
        },
        {
            name: "Issue",
            type: 64,
        },
        {
            name: "Transfer",
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