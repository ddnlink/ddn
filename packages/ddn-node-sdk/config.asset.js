exports.evidence = {
    transactions: [
        {
            name: "Evidence",
            type: 10,
        }
    ],
    package: "@ddn/ddn-evidence"
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
            name: "AobFlags",
            type: 62,
        },
        {
            name: "AobAcl",
            type: 63,
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
    package: "@ddn/ddn-aob"
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
    package: "@ddn/ddn-dao"
}
exports.dapp = {
    transactions: [
        {
            name: "Dapp",
            type: 11,
        },
        {
            name: "InTransfer",
            type: 12,
        },
        {
            name: "OutTransfer",
            type: 13,
        },
    ],
    package: "@ddn/ddn-dapp"
}