const { expect } = require('chai');
const hre = require('hardhat');

describe('WorkflowRegistry', function () {
  let registry;
  let owner;
  let other;
  let ethers;

  beforeEach(async function () {
    ethers = hre.ethers;
    [owner, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory('WorkflowRegistry');
    registry = await Registry.deploy();
    await registry.deployed();
  });

  function keccak(str) {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
  }

  describe('registerWorkflow', function () {
    it('stores workflow data retrievable by getWorkflow', async function () {
      const id = 'wf-001';
      const hash = keccak('manifest-json');
      const key = 'storage-root-hash-abc';

      await registry.registerWorkflow(id, hash, key);

      const [mHash, sKey, createdAt, execCount] = await registry.getWorkflow(owner.address, id);
      expect(mHash).to.equal(hash);
      expect(sKey).to.equal(key);
      expect(createdAt.toNumber()).to.be.gt(0);
      expect(execCount.toNumber()).to.equal(0);
    });

    it('emits WorkflowRegistered event', async function () {
      const id = 'wf-event';
      const hash = keccak('manifest');
      const key = 'key-event';

      await expect(registry.registerWorkflow(id, hash, key))
        .to.emit(registry, 'WorkflowRegistered')
        .withArgs(owner.address, id, hash, key, await latestTimestamp());
    });

    it('allows different owners to register the same workflowId independently', async function () {
      const id = 'wf-shared';
      const hash1 = keccak('manifest-1');
      const hash2 = keccak('manifest-2');

      await registry.connect(owner).registerWorkflow(id, hash1, 'key-1');
      await registry.connect(other).registerWorkflow(id, hash2, 'key-2');

      const [h1] = await registry.getWorkflow(owner.address, id);
      const [h2] = await registry.getWorkflow(other.address, id);
      expect(h1).to.equal(hash1);
      expect(h2).to.equal(hash2);
    });
  });

  describe('recordExecution', function () {
    const workflowId = 'wf-exec-test';

    beforeEach(async function () {
      await registry.registerWorkflow(workflowId, keccak('manifest'), 'storage-key');
    });

    it('increments executionCount after recording', async function () {
      await registry.recordExecution(workflowId, keccak('exec-1'), 'tx-storage-001');

      const [, , , execCount] = await registry.getWorkflow(owner.address, workflowId);
      expect(execCount.toNumber()).to.equal(1);
    });

    it('emits ExecutionRecorded event', async function () {
      const execHash = keccak('exec-2');
      const storageTx = 'storage-tx-hash-002';

      await expect(registry.recordExecution(workflowId, execHash, storageTx))
        .to.emit(registry, 'ExecutionRecorded')
        .withArgs(owner.address, workflowId, execHash, storageTx, await latestTimestamp());
    });

    it('reverts if workflow not registered', async function () {
      await expect(
        registry.recordExecution('nonexistent-wf', keccak('exec'), 'tx')
      ).to.be.revertedWith('WorkflowRegistry: workflow not registered');
    });

    it('reverts if caller is not the workflow owner', async function () {
      await expect(
        registry.connect(other).recordExecution(workflowId, keccak('exec'), 'tx')
      ).to.be.revertedWith('WorkflowRegistry: workflow not registered');
    });

    it('returns latest execution', async function () {
      await registry.recordExecution(workflowId, keccak('exec-a'), 'tx-1');
      await registry.recordExecution(workflowId, keccak('exec-b'), 'tx-2');

      const [latest, storageTx] = await registry.getLatestExecution(owner.address, workflowId);
      expect(latest).to.equal(keccak('exec-b'));
      expect(storageTx).to.equal('tx-2');
    });

    it('accumulates count across multiple runs', async function () {
      for (let i = 0; i < 5; i++) {
        await registry.recordExecution(workflowId, keccak(`exec-${i}`), `tx-${i}`);
      }
      const [, , , execCount] = await registry.getWorkflow(owner.address, workflowId);
      expect(execCount.toNumber()).to.equal(5);
    });
  });

  describe('getLatestExecution', function () {
    it('reverts when no executions exist', async function () {
      await registry.registerWorkflow('wf-empty', keccak('m'), 'k');
      await expect(
        registry.getLatestExecution(owner.address, 'wf-empty')
      ).to.be.revertedWith('WorkflowRegistry: no executions');
    });
  });
});

async function latestTimestamp() {
  const block = await hre.ethers.provider.getBlock('latest');
  return block.timestamp;
}
