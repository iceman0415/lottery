import type {
    LotteryInstance,
    LotteryContract,
  } from '../types/truffle-contracts/Lottery'
  
  const Lottery: LotteryContract = artifacts.require('Lottery')
  
  let lotteryInstance: LotteryInstance
  
  beforeEach(async () => {
    lotteryInstance = await Lottery.new()
  })
  
  contract('Lottery', (accounts) => {
    it('allows one account to enter', async () => {
      await lotteryInstance.enter({
        from: accounts[0],
        value: web3.utils.toWei('0.01', 'ether'),
      })
  
      const players = await lotteryInstance.getPlayers({
        from: accounts[0],
      })
  
      assert.equal(accounts[0], players[0])
      assert.equal(players.length, 1)
    })
  
    it('requires a minimum value', async () => {
      try {
        await lotteryInstance.enter({
          from: accounts[0],
          value: web3.utils.toWei('0.0099', 'ether'),
        })
  
        assert.fail('Should have raised exception "minimum value required"')
      } catch (e) {
        assert.ok(e, 'Exception "minimum value required" has been raised')
      }
    })
  
    it('allows multiple accounts to enter', async () => {
      await lotteryInstance.enter({
        from: accounts[0],
        value: web3.utils.toWei('0.02', 'ether'),
      })
  
      await lotteryInstance.enter({
        from: accounts[1],
        value: web3.utils.toWei('0.03', 'ether'),
      })
  
      await lotteryInstance.enter({
        from: accounts[2],
        value: web3.utils.toWei('0.04', 'ether'),
      })
  
      const players = await lotteryInstance.getPlayers({
        from: accounts[0],
      })
  
      assert.equal(accounts[0], players[0])
      assert.equal(accounts[1], players[1])
      assert.equal(accounts[2], players[2])
  
      assert.equal(3, players.length)
    })
  
    it('only the owner can call pickWinner method', async () => {
      await lotteryInstance.enter({
        from: accounts[0],
        value: web3.utils.toWei('0.02', 'ether'),
      })
  
      await lotteryInstance.enter({
        from: accounts[1],
        value: web3.utils.toWei('0.02', 'ether'),
      })
  
      await lotteryInstance.enter({
        from: accounts[2],
        value: web3.utils.toWei('0.02', 'ether'),
      })
  
      try {
        await lotteryInstance.pickWinner({
          from: accounts[1], // accounts[1] is not the owner
        })
  
        assert.fail('Should have raised exception "Not the owner"')
      } catch (err) {
        assert.ok(err, 'Exception "Not the owner" has been raised')
      }
    })
  
    it('sends money to the winner and resets the players array', async () => {
      await lotteryInstance.enter({
        from: accounts[0],
        value: web3.utils.toWei('0.02', 'ether'),
      })
  
      await lotteryInstance.enter({
        from: accounts[1],
        value: web3.utils.toWei('0.03', 'ether'),
      })
  
      await lotteryInstance.enter({
        from: accounts[2],
        value: web3.utils.toWei('0.04', 'ether'),
      })
  
      const tx = await lotteryInstance.pickWinner({
        from: accounts[0],
      })
  
      // Let's grab the event "WinnerPicked" emitted where
      // we have the details of this transaction
      const { logs } = tx
      assert.ok(Array.isArray(logs))
      assert.equal(logs.length, 1)
  
      const log = logs[0]
      assert.equal(log.event, 'WinnerPicked')
  
      const index = parseInt(log.args.index.toString(10), 10)
      const prize = parseFloat(web3.utils.fromWei(log.args.prize.toString(10))) // in ether
  
      assert.equal(prize, 0.09) // 0.02 + 0.03 + 0.04
      assert.equal(accounts[index], log.args.winner)
  
      // Make sure the list of players is empty
      const players = await lotteryInstance.getPlayers()
      assert.equal(0, players.length)
    })
  })