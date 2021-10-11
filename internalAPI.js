const shortid = require('shortid');

class BitfocusCloudError extends Error {
	constructor(name, message) {
		super(message);
		this.name = name;
	}
}

module.exports = {

	async clientCommand(remoteId, name, ...args) {
		const callerId = shortid.generate();
		const replyChannel = 'companionProcResult:' + callerId;

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new BitfocusCloudError('call_timeout', 'ClientCommand timeout for ' + name));
				this.socket.unsubscribe(replyChannel);
				this.socket.closeChannel(replyChannel);
			}, 10000);
	
			(async () => {
				for await (let data of this.socket.subscribe(replyChannel)) {
					console.log('::::::: Got response for command %o', remoteId + ':' + name)
					clearTimeout(timer);
					if (data.error) {
						reject(new BitfocusCloudError('rpc_error', 'rpc error: ' + data.error));
					} else {
						resolve(data.result);
					}

					this.socket.unsubscribe(replyChannel);
					this.socket.closeChannel(replyChannel);
					break;
				}
			})();

			this.socket.transmitPublish(`companionProc:${remoteId}:${name}`, { args, callerId });
		});
	}

}