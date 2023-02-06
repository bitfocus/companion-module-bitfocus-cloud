/*
 * This file is part of the Companion project
 * Copyright (c) 2018 Bitfocus AS
 * Authors: William Viker <william@bitfocus.io>, Håkon Nessjøen <haakon@bitfocus.io>
 *
 * This program is free software.
 * You should have received a copy of the MIT licence as well as the Bitfocus
 * Individual Contributor License Agreement for companion along with
 * this program.
 *
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Companion software without
 * disclosing the source code of your own applications.
 *
 */
import {
	CompanionButtonStyleProps,
	InstanceBase,
	InstanceStatus,
	runEntrypoint,
	SomeCompanionConfigField,
} from '@companion-module/base'
import { GetConfigFields, CloudConfig } from './config'
import { initVariables } from './variables'
import { GetFeedbacks } from './feedback'
import { CloudClient, CCModuleState, CCLogLevel } from 'companion-cloud-client'
import { CCLogLevel2LogLevel, CCModuleState2InstanceState, CreateBankControlId } from './utils'

/**
 * @description Companion instance class for Zoom
 */
class CloudInstance extends InstanceBase<CloudConfig> {
	public config: CloudConfig = {
		uuid: '',
	}

	/**
	 * @description the current cloud uuid
	 * @type {string}
	 */
	public uuid = ''

	/**
	 * @description bank cache of remote companion
	 */
	public bankCache: { [controlId: string]: { data: Partial<CompanionButtonStyleProps> } & { feedbackIds: string[] } } =
		{}

	/**
	 * @description the cloud client
	 * @type {CloudClient | null}
	 * @public
	 */
	public cloudClient: CloudClient | null = null

	/**
	 * @description constructor
	 * @param internal
	 */
	constructor(internal: unknown) {
		super(internal)
	}

	/**
	 * @description when config is updated
	 * @param config
	 */
	public async configUpdated(config: CloudConfig): Promise<void> {
		this.config = config
		this.saveConfig(config)
		this.log('info', 'changing config!')

		this.setFeedbackDefinitions(GetFeedbacks(this))

		if (this.uuid !== config.uuid) {
			this.log('info', `changing uuid from ${this.uuid} to ${config.uuid}`)
			this.uuid = config.uuid
			this.cloudClient?.destroy()
			this.updateStatus(InstanceStatus.Connecting, 'connecting to cloud')

			this.cloudClient = new CloudClient(this.uuid)
			this.cloudClient.on('error', (err: Error) => {
				this.log('error', err.message)
			})
			this.cloudClient.on('log', (level: CCLogLevel, message: string) => {
				this.log(CCLogLevel2LogLevel(level), message)
			})
			this.cloudClient.on('state', (state: CCModuleState, message?: string) => {
				this.log('info', 'state changed: ' + state + ' ' + message)
				this.updateStatus(CCModuleState2InstanceState(state), message)

				if (state === 'OK' && this.cloudClient) {
					this.cloudClient
						.clientCommand('allbanks')
						.then((alldata: any) => {
							this.updateAll(alldata)
						})
						.catch((e) => {
							this.log('error', 'Failed to get initial banks from companion: ' + e.message)
						})
				}
			})
			this.cloudClient.on('update', (page: number, bank: number, data: Partial<CompanionButtonStyleProps>) => {
				this.updateSingle(page, bank, data)
			})
			this.cloudClient.on(
				'updateAll',
				(alldata: { page: number; bank: number; data: Partial<CompanionButtonStyleProps> }[]) => {
					this.updateAll(alldata)
				}
			)
			await this.cloudClient.init()
		}
	}

	updateSingle(page: number, bank: number, data: Partial<CompanionButtonStyleProps>) {
		const remControlId = CreateBankControlId(page, bank)
		this.bankCache[remControlId] = {
			data,
			feedbackIds: this.bankCache[remControlId]?.feedbackIds || [],
		}
		for (const feedbackId of this.bankCache[remControlId]?.feedbackIds || []) {
			this.checkFeedbacksById(feedbackId)
		}
	}

	updateAll(alldata: { page: number; bank: number; data: Partial<CompanionButtonStyleProps> }[]) {
		console.log('UPDATE ALLE: ', alldata)
		for (const { page, bank, data } of alldata) {
			const remControlId = CreateBankControlId(page, bank)
			this.bankCache[remControlId] = {
				data,
				feedbackIds: this.bankCache[remControlId]?.feedbackIds || [],
			}
		}
		this.checkFeedbacks('change')
	}

	/**
	 * @description get all config field information
	 * @returns the config fields
	 */
	getConfigFields(): SomeCompanionConfigField[] {
		this.log('info', 'getting config fields')
		return GetConfigFields()
	}
	/**
	 * @description triggered on instance being enabled
	 * @param config
	 */
	public async init(config: CloudConfig): Promise<void> {
		this.log('info', `Cloud client module is initializing!`)

		await this.configUpdated(config)
	}

	/**
	 * @description close connections and stop timers/intervals
	 */
	async destroy() {
		this.log('info', 'destroying instance')
		this.cloudClient?.destroy()
		this.cloudClient = null
	}

	/**
	 * @description update variables values
	 */
	public UpdateVariablesValues(): void {
		this.log('info', 'updating variables values')
	}

	/**
	 * @description init variables
	 */
	public InitVariables(): void {
		this.log('info', 'initializing variables')
		initVariables(this)
	}
}

runEntrypoint(CloudInstance, [])
