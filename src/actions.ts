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
import { CompanionActionDefinition, CompanionActionDefinitions } from '@companion-module/base'
import { CloudConfig } from './config'
import { InstanceBaseExt } from './utils'

export enum ActionId {
	buttonUp = 'buttonUp',
	buttonDown = 'buttonDown',
}

/**
 * Main function to create the actions
 * @param instance Give the instance so we can extract data
 * @returns CompanionActions
 */
export function GetActions(_instance: InstanceBaseExt<CloudConfig>): CompanionActionDefinitions {
	const actions: { [id in ActionId]: CompanionActionDefinition | undefined } = {
		[ActionId.buttonUp]: {
			name: 'Release button',
			options: [
				{
					type: 'number',
					min: 1,
					max: 99,
					id: 'page',
					default: 1,
					label: 'Page',
				},
				{
					type: 'number',
					min: 1,
					max: 32,
					id: 'bank',
					default: 1,
					label: 'Bank',
				},
			],
			callback: async (_action): Promise<void> => {
				if (_instance.cloudClient) {
					try {
						await _instance.cloudClient.clientCommand('release', {
							page: _action.options.page,
							bank: _action.options.bank,
						})
					} catch (e) {
						_instance.log('error', 'Failed to release button: ' + (e instanceof Error ? e.message : e))
					}
				}
			},
		},
		[ActionId.buttonDown]: {
			name: 'Press button',
			options: [
				{
					type: 'number',
					min: 1,
					max: 99,
					id: 'page',
					default: 1,
					label: 'Page',
				},
				{
					type: 'number',
					min: 1,
					max: 32,
					id: 'bank',
					default: 1,
					label: 'Bank',
				},
			],
			callback: async (_action): Promise<void> => {
				if (_instance.cloudClient) {
					try {
						await _instance.cloudClient.clientCommand('push', {
							page: _action.options.page,
							bank: _action.options.bank,
						})
					} catch (e) {
						_instance.log('error', 'Failed to release button: ' + (e instanceof Error ? e.message : e))
					}
				}
			},
		},
	}

	return actions
}
