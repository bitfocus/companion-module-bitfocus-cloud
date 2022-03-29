var instance_skel = require('../../instance_skel')
var fs = require('fs')

var internal_api = require('./internalAPI')
var actions = require('./actions')
var feedback = require('./feedback')
var presets = require('./presets')
var variables = require('./variables')

const SCClient = require('socketcluster-client')

var debug
var log

/**
 * Companion instance class for the Bitfocus Cloud
 *
 * @extends instance_skel
 * @version 1.0.0
 * @since 1.0.0
 * @author Håkon Nessjøen <haakon@bitfocus.io>
 * @author Keith Rocheck <keith.rocheck@gmail.com>
 */
class instance extends instance_skel {
	/**
	 * Create an instance of a videohub module.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @param {string} id - the instance ID
	 * @param {Object} config - saved user configuration parameters
	 * @since 1.0.0
	 */
	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...actions,
			...feedback,
			...presets,
			...variables,
			...internal_api,
		})

		this.clientId = id

		this.regions = [];
		this.sockets = [];
		this.updateIds = [];

		this.actions() // export actions
	}

	/**
	 * Setup the actions.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @access public
	 * @since 1.0.0
	 */
	actions(system) {
		this.setActions(this.getActions())
	}

	/**
	 * Executes the provided action.
	 *
	 * @param {Object} action - the action to be executed
	 * @access public
	 * @since 1.0.0
	 */
	action(action) {
		var opt = action.options

		switch (action.action) {
			case 'push':
				this.runAction(action.action, { page: opt.page, bank: opt.bank })
				break

			case 'release':
				this.runAction(action.action, { page: opt.page, bank: opt.bank })
				break
		}
	}

	async runAction(action, args) {
		if (this.isConnected) {
			try {
				await this.clientCommand(this.config.remote_id, action, args)
			} catch (e) {
				this.log('warning', `Error running action: ${action}: ${e.message}`)
			}
		}
	}

	/**
	 * Creates the configuration fields for web config.
	 *
	 * @returns {Array} the config fields
	 * @access public
	 * @since 1.0.0
	 */
	config_fields() {
		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'You will need a bitfocus cloud account to use this service.',
			},
			{
				type: 'textinput',
				id: 'remote_id',
				label: 'Remote Companion cloud id',
				width: 12,
				default: 'aaa-bbb-ccc-ddd-eee-fff',
				regex: '^[0-9a-z-]+$',
			},
			...this.regionConfigFields(),
		]
	}

	/**
	 * Clean up the instance before it is destroyed.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	destroy() {
		this.isRunning = false
		this.isConnected = false

		if (this.intervalTimer) {
			clearInterval(this.intervalTimer)
			this.intervalTimer = undefined;
		}

		this.disconnectAll();

		this.debug('destroy', this.id)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	init() {
		debug = this.debug
		log = this.log
		this.isRunning = true
		this.banks = []
		this.isConnected = false
		this.initialConnect = false
		this.intervalTimer = setInterval(() => this.tick(), 10000)
		this.knownIds = {}
		this.regions = []
		this.initVariables()
		this.initFeedbacks()
		this.initPresets()
		this.checkFeedbacks('main')
		this.initRegions()

		if (this.config.remote_id) {
			this.status(this.STATUS_WARNING, 'Connecting...')
			this.init_sockets()
		}
	}

	initRegions() {
		this.system.emit('config_get', 'cloud_servers', (regions) => {
			try {
				console.log("INIT REGIONS: ", regions);
				if (regions instanceof Array) {
					this.regions = [ ...regions, { id: 'test', label: 'test', hostname: 'no-oslo-cloud1.bitfocus.io' } ];
				} else {
					console.log('what is', regions)
				}
			} catch (e) {
				console.log('Malformed cloud region', e)
			}
		})
	}

	checkStatus() {
		let connected = 0;
		let disconnected = 0;
		this.sockets.forEach(socket => {
			if (socket.cloudConnected) {
				connected++;
			} else {
				disconnected++;
			}
		})

		if (connected === 0) {
			this.initialConnect = true
			this.status(this.STATUS_ERROR, 'Disconnected');
		} else if (connected > 0 && disconnected > 0) {
			this.status(this.STATUS_WARNING, 'Some connections are not ready');
		} else if (connected > 0 && disconnected === 0) {
			this.status(this.STATUS_OK);
		}

		if (connected > 0) {
			this.isConnected = true;
		} else {
			this.isConnected = false;
		}

		console.log("STATUS: ", { connected, disconnected });
	}

	regionConfigFields() {
		console.log('this.regions', this.regions)
		return [{
			type: 'dropdown',
			multiple: true,
			id: 'region',
			label: "Cloud region",
			choices: this.regions.map((region) => ({
				id: region.id,
				label: region.label + '(' + region.location + ')',
			})),
			width: 12,
			default: false,
		}];
		return this.regions.map((region) => ({
			type: 'checkbox',
			id: 'region_' + region.id,
			label: region.label + '(' + region.location + ')',
			width: 12,
			default: false,
		}))
	}

	async tick() {
		debug('TICKING')
		if (this.regions.length === 0) {
			initRegions();
			if (this.regions.length > 0) {
				this.init_sockets();
			}
		}

		this.checkStatus();

		// TODO: Rewrite
		this.sockets.forEach(async (socket) => {
			if (socket.cloudConnected) {
				try {
					const result = await socket.invoke('companion-alive', this.config.remote_id)
					if (result) {
						if (this.initialConnect) {
							//this.status(this.STATUS_OK, 'Connected')
							this.isConnected = true
							this.initialConnect = false

							const banks = await this.clientCommand(this.config.remote_id, 'getBanks', {})
							this.banks = banks

							this.checkFeedbacks('main')
							this.initPresets()
						}
					}
				} catch (e) {
					// TODO: check status of all sockets before changing status
					if (this.isConnected || this.initialConnect) {
						//this.status(this.STATUS_ERROR, 'Connection error')
						// Remove region??
						this.log('warning', `Connection error: ${e.message}`)
					}
				}
			}
		});
	}

	addSocket(region) {
		const socket = SCClient.create({
			hostname: region.hostname,
			port: 443,
			secure: true,
			autoReconnectOptions: {
				initialDelay: 1000, //milliseconds
				randomness: 2000, //milliseconds
				multiplier: 1.5, //decimal
				maxDelay: 10000, //milliseconds
			},
		})
		this.sockets.push(socket);
		debug('adding connection for %o', region.hostname);

		;(async () => {
			while (this.isRunning && this.sockets.includes(socket)) {
				for await (let _event of socket.listener('connect')) {
					socket.cloudConnected = true;

					this.checkStatus();

					// eslint-disable-line
					debug('Socket is connected')

					try {
						await this.tick()
					} catch (e) {}
				}
				await new Promise((resolve) => setTimeout(resolve, 1000))
			}
			debug('old socket cleaned up');
		})()
		;(async () => {
			while (this.isRunning && this.sockets.includes(socket)) {
				for await (let data of socket.subscribe('companion-banks:' + this.config.remote_id)) {
					const updateId = data.updateId;

					if (this.updateIds.includes(updateId)) {
						return;
					}
					this.updateIds.push(updateId);

					if (data.type === 'single') {
						try {
							this.banks[data.page][data.bank] = data.data
							this.checkFeedbacks('main')
							this.initPresets()
						} catch (e) {}
					} else if (data.type === 'full') {
						try {
							this.banks = data.data
							this.checkFeedbacks('main')
							this.initPresets()
						} catch (e) {}
					}

					while (this.updateIds.length > 100) {
						this.updateIds.shift();
					}
				}
			}
		})()
		;(async () => {
			while (this.isRunning && this.sockets.includes(socket)) {
				for await (let data of socket.listener('error')) {
					socket.cloudConnected = false
					if (this.isConnected) {
						this.checkStatus();
						//this.status(this.STATUS_ERROR, 'Connection error')
					}
					this.log('warning', 'Cloud connection error on region ' + region.label)
				}
			}
		})()
	}

	disconnectAll() {
		this.sockets.forEach((socket) => {
			socket.killAllChannels()
			socket.killAllListeners()
			socket.disconnect()
		});
		this.sockets.length = 0;
		this.isConnected = false;
		this.initialConnect = true
	}

	/**
	 * INTERNAL: use setup data to initalize the tcp socket object.
	 *	
	 * @access protected
	 * @since 1.0.0
	 */
	init_sockets() {
		// Regions are not ready, wait for them to be
		if (this.regions.length === 0) {
			return;
		}

		this.disconnectAll();

		this.initialConnect = true

		const regions = this.regions.filter((region) => this.config.region.includes(region.id))

		debug('Connecting to %o', regions);

		regions.forEach((region) => {
			this.addSocket(region);
		});
	}

	/**
	 * INTERNAL: initialize feedbacks.
	 *
	 * @access protected
	 * @since 1.1.0
	 */
	initFeedbacks() {
		// feedbacks
		var feedbacks = this.getFeedbacks()

		this.setFeedbackDefinitions(feedbacks)
	}

	/**
	 * Process an updated configuration array.
	 *
	 * @param {Object} config - the new configuration
	 * @access public
	 * @since 1.0.0
	 */
	updateConfig(config) {
		var resetConnection = false

		if (this.config.remote_id != config.remote_id) {
			// TODO: Reconnect
		}

		this.config = config

		this.status(this.STATUS_WARNING, 'Connecting...')
		this.init_sockets()
	}
}

exports = module.exports = instance
