const shortid = require('shortid');

class BitfocusCloudError extends Error {
	constructor(name, message) {
		super(message);
		this.name = name;
	}
}

module.exports = {

	async clientCommand(clientId, name, ...args) {
		const id = shortid.generate();
		const replyChannel = 'clientProcResult:' + id;

		return new Promise((resolve, reject) => {
			setTimeout(() => {
				reject(new BitfocusCloudError('call_timeout', 'ClientCommand timeout for ' + name));
				this.socket.unsubscribe(replyChannel);
				this.socket.closeChannel(replyChannel);
			}, 10000);
	
			(async () => {
				for await (let data of this.socket.subscribe(replyChannel)) {
					if (data.error) {
						reject(new Error('rpc error: ' + data.error));
					} else {
						resolve(data.result);
					}

					this.socket.unsubscribe(replyChannel);
					this.socket.closeChannel(replyChannel);
				}
			})();

			this.socket.transmitPublish(`clientProc:${clientId}:${name}`, { replyChannel, args, callerId: this.clientId });
		});
	}

}