// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WorkflowRegistry {
    struct Workflow {
        bytes32 manifestHash;
        string storageKey;
        uint256 createdAt;
        uint256 executionCount;
    }

    struct Execution {
        bytes32 executionTxHash;
        string storageTxHash;
        uint256 timestamp;
    }

    // owner => workflowId => Workflow
    mapping(address => mapping(string => Workflow)) private workflows;
    // owner => workflowId => Execution[]
    mapping(address => mapping(string => Execution[])) private executions;

    event WorkflowRegistered(
        address indexed owner,
        string workflowId,
        bytes32 manifestHash,
        string storageKey,
        uint256 timestamp
    );

    event ExecutionRecorded(
        address indexed owner,
        string workflowId,
        bytes32 executionTxHash,
        string storageTxHash,
        uint256 timestamp
    );

    function registerWorkflow(
        string calldata workflowId,
        bytes32 manifestHash,
        string calldata storageKey
    ) external {
        workflows[msg.sender][workflowId] = Workflow({
            manifestHash: manifestHash,
            storageKey: storageKey,
            createdAt: block.timestamp,
            executionCount: 0
        });

        emit WorkflowRegistered(msg.sender, workflowId, manifestHash, storageKey, block.timestamp);
    }

    function recordExecution(
        string calldata workflowId,
        bytes32 executionTxHash,
        string calldata storageTxHash
    ) external {
        Workflow storage workflow = workflows[msg.sender][workflowId];
        require(workflow.createdAt != 0, "WorkflowRegistry: workflow not registered");

        workflow.executionCount += 1;

        executions[msg.sender][workflowId].push(Execution({
            executionTxHash: executionTxHash,
            storageTxHash: storageTxHash,
            timestamp: block.timestamp
        }));

        emit ExecutionRecorded(msg.sender, workflowId, executionTxHash, storageTxHash, block.timestamp);
    }

    function getWorkflow(
        address owner,
        string calldata workflowId
    ) external view returns (
        bytes32 manifestHash,
        string memory storageKey,
        uint256 createdAt,
        uint256 executionCount
    ) {
        Workflow storage w = workflows[owner][workflowId];
        return (w.manifestHash, w.storageKey, w.createdAt, w.executionCount);
    }

    function getLatestExecution(
        address owner,
        string calldata workflowId
    ) external view returns (
        bytes32 executionTxHash,
        string memory storageTxHash,
        uint256 timestamp
    ) {
        Execution[] storage execs = executions[owner][workflowId];
        require(execs.length > 0, "WorkflowRegistry: no executions");
        Execution storage e = execs[execs.length - 1];
        return (e.executionTxHash, e.storageTxHash, e.timestamp);
    }

    function getExecutionCount(
        address owner,
        string calldata workflowId
    ) external view returns (uint256) {
        return executions[owner][workflowId].length;
    }
}
