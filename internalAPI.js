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
				this.sockets.forEach(socket => {
					socket.unsubscribe(replyChannel);
					socket.closeChannel(replyChannel);
				});
			}, 10000);
	
			let isHandeled = false;
			this.sockets.forEach(socket => {
				(async () => {
					for await (let data of socket.subscribe(replyChannel)) {
						if (isHandeled) {
							socket.unsubscribe(replyChannel);
							socket.closeChannel(replyChannel);
							return
						}

						console.log('::::::: Got response for command %o', remoteId + ':' + name)
						clearTimeout(timer);
						isHandeled = true;

						if (data.error) {
							reject(new BitfocusCloudError('rpc_error', 'rpc error: ' + data.error));
						} else {
							resolve(data.result);
						}

						socket.unsubscribe(replyChannel);
						socket.closeChannel(replyChannel);
						break;
					}
				})();

				console.log("%%%%% SENDING COMMAND TO A CONNECTION: ", `companionProc:${remoteId}:${name}`);
				socket.transmitPublish(`companionProc:${remoteId}:${name}`, { args, callerId });
			});
		});
	}

}