var instance_skel = require('../../instance_skel');
var fs = require('fs');

var internal_api  = require('./internalAPI');
var actions       = require('./actions');
var feedback      = require('./feedback');
var presets       = require('./presets');
var variables     = require('./variables');

const SCClient = require("socketcluster-client");


var debug;
var log;

/**
 * Companion instance class for the Blackmagic VideoHub Routers.
 * 
 * !!! This class is being used by the bmd-multiview16 module, be careful !!!
 *
 * @extends instance_skel
 * @version 1.0.0
 * @since 1.0.0
 * @author Håkon Nessjøen <haakon@bitfocus.io>
 * @author Keith Rocheck <keith.rocheck@gmail.com>
 * @author Peter Schuster
 * @author Jim Amen <jim.amen50@gmail.com>
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
		super(system, id, config);

		Object.assign(this, {
			...actions,
			...feedback,
			...presets,
			...variables,
			...internal_api
		});

		this.clientId = id;
	
		this.actions(); // export actions
	}

	/**
	 * Setup the actions.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @access public
	 * @since 1.0.0
	 */
	actions(system) {
		this.setActions(this.getActions());
	}

	/**
	 * Executes the provided action.
	 *
	 * @param {Object} action - the action to be executed
	 * @access public
	 * @since 1.0.0
	 */
	action(action) {
		var opt = action.options;

		switch (action.action) {

			case 'push':
				this.runAction(action.action, { page: opt.page, bank: opt.bank });
				break;

			case 'release':
				this.runAction(action.action, { page: opt.page, bank: opt.bank });
				break;
		}
	}

	async runAction (action, args) {
		if (this.isConnected) {
			try {
				await this.clientCommand(this.config.remote_id, action, args);
			} catch (e) {
				this.log('error', `Error running action: ${action}: ${e.message}`);
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
				value: 'You will need a bitfocus cloud account to use this service.'
			},
			{
				type: 'textinput',
				id: 'remote_id',
				label: 'Remote Companion cloud id',
				width: 12,
				default: 'aaa-bbb-ccc-ddd-eee-fff',
				regex: "^[0-9a-z-]+$"
			}
		]
	}

	/**
	 * Clean up the instance before it is destroyed.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	destroy() {
		this.isRunning = false;
		this.isConnected = false;

		if (this.socket !== undefined) {
			this.socket.killAllChannels();
			this.socket.killAllListeners();
			this.socket.disconnect();
		}

		this.debug("destroy", this.id);
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	init() {
		debug = this.debug;
		log = this.log;
		this.isRunning = true;
		this.banks = [];
		this.isConnected = false;
		this.initialConnect = false;
		this.intervalTimer = setInterval(() => this.tick(), 10000);

		this.initVariables();
		this.initFeedbacks();
		this.initPresets();
		this.checkFeedbacks('main');

		if (this.config.remote_id) {
			this.status(this.STATUS_WARNING, 'Connecting...');
			this.init_socket();
		}
	}

	async tick() {
		debug('TICKING');
		if (this.socket && this.socket.state === this.socket.OPEN) {
			debug('has socket');
			try {
				const result = await this.socket.invoke('companion-alive', this.config.remote_id)
				if (result) {
					if (!this.isConnected) {
						this.status(this.STATUS_OK, 'Connected');
						this.isConnected = true;
						this.initialConnect = false;

						const banks = await this.clientCommand(this.config.remote_id, 'getBanks', {})
						this.banks = banks;

						this.checkFeedbacks('main');
					}
				}
			} catch (e) {
				if (this.isConnected || this.initialConnect) {
					this.status(this.STATUS_ERROR, 'Connection error');
					this.isConnected = false;
					this.initialConnect = false;
					this.log('error', `Connection error`);
				}
			}
		}
	}

	/**
	 * INTERNAL: use setup data to initalize the tcp socket object.
	 *
	 * @access protected
	 * @since 1.0.0
	 */
	init_socket() {

		if (this.socket) {
			this.socket.killAllChannels();
			this.socket.killAllListeners();
			this.socket.disconnect();
		}

		debug('Connecting');
		this.socket = SCClient.create({
			hostname: '127.0.0.1',
			port: 8001,
			secure: false,
			autoReconnectOptions: {
				initialDelay: 1000, //milliseconds
				randomness: 500, //milliseconds
				multiplier: 1.5, //decimal
				maxDelay: 20000 //milliseconds
			}
		});

		(async () => {
			while (this.isRunning) {
				for await (let _event of this.socket.listener("connect")) {  // eslint-disable-line
					debug('Socket is connected')
					this.initialConnect = true;

					try {
						await this.tick();
					} catch (e) {}

				}
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		})();

		(async () => {
			while (this.isRunning) {
				for await (let data of this.socket.subscribe('companion-banks:' + this.config.remote_id)) {
					if (data.type === 'single') {
						try {
							this.banks[data.page][data.bank] = data.data;
							this.checkFeedbacks('main');
						} catch (e) {}
					} else if (data.type === 'full') {
						try {
							this.banks = data.data;
							this.checkFeedbacks('main');
						} catch (e) {}
					}
				}
			}
		})();

		(async () => {
			while (this.isRunning) {
				for await (let data of this.socket.listener('error')) {
					if (this.isConnected) {
						this.isConnected = false;
						this.status(this.STATUS_ERROR, 'Connection error');
						this.log("error", "Cloud connection error.");
					}
				}
			}
		})();
	}

	/**
	 * INTERNAL: initialize feedbacks.
	 *
	 * @access protected
	 * @since 1.1.0
	 */
	initFeedbacks() {
		// feedbacks
		var feedbacks = this.getFeedbacks();

		this.setFeedbackDefinitions(feedbacks);
	}

	/**
	 * Process an updated configuration array.
	 *
	 * @param {Object} config - the new configuration
	 * @access public
	 * @since 1.0.0
	 */
	updateConfig(config) {
		var resetConnection = false;

		if (this.config.remote_id != config.remote_id)
		{
			// TODO: Reconnect
		}

		this.config = config;

		this.status(this.STATUS_WARNING, 'Connecting...');
		this.init_socket();
	}
}

exports = module.exports = instance;