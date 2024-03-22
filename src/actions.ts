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
import { CloudConfig } from './config.js'
import { CreateLocationFromLocationText, InstanceBaseExt } from './utils.js'

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
					type: 'dropdown',
					label: 'Target',
					id: 'location_target',
					default: 'text',
					choices: [
						{ id: 'text', label: 'From text' },
						{ id: 'expression', label: 'From expression' },
					],
				},
				{
					type: 'textinput',
					label: 'Remote button location (text with variables)',
					tooltip: 'eg 1/0/0 or $(this:page)/$(this:row)/$(this:column)',
					id: 'location_text',
					default: '$(this:page)/$(this:row)/$(this:column)',
					isVisible: (options) => options.location_target === 'text',
					useVariables: {
						locationBased: true,
					} as any,
				},
				{
					type: 'textinput',
					label: 'Remote button location (expression)',
					tooltip: 'eg `1/0/0` or `${$(this:page) + 1}/${$(this:row)}/${$(this:column)}`',
					id: 'location_expression',
					default: `concat($(this:page), '/', $(this:row), '/', $(this:column))`,
					isVisible: (options) => options.location_target === 'expression',
					useVariables: {
						locationBased: true,
					} as any,
				},
			],
			callback: async (action): Promise<void> => {
				if (_instance.cloudClient) {
					try {
						const location = CreateLocationFromLocationText(
							action.options.location_text ? String(action.options.location_text) : ''
						)
						await _instance.cloudClient.clientCommand('release', {
							location,
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
					type: 'dropdown',
					label: 'Target',
					id: 'location_target',
					default: 'text',
					choices: [
						{ id: 'text', label: 'From text' },
						{ id: 'expression', label: 'From expression' },
					],
				},
				{
					type: 'textinput',
					label: 'Remote button location (text with variables)',
					tooltip: 'eg 1/0/0 or $(this:page)/$(this:row)/$(this:column)',
					id: 'location_text',
					default: '$(this:page)/$(this:row)/$(this:column)',
					isVisible: (options) => options.location_target === 'text',
					useVariables: {
						locationBased: true,
					} as any,
				},
				{
					type: 'textinput',
					label: 'Remote button location (expression)',
					tooltip: 'eg `1/0/0` or `${$(this:page) + 1}/${$(this:row)}/${$(this:column)}`',
					id: 'location_expression',
					default: `concat($(this:page), '/', $(this:row), '/', $(this:column))`,
					isVisible: (options) => options.location_target === 'expression',
					useVariables: {
						locationBased: true,
					} as any,
				},
			],
			callback: async (action): Promise<void> => {
				if (_instance.cloudClient) {
					try {
						const location = CreateLocationFromLocationText(
							action.options.location_text ? String(action.options.location_text) : ''
						)
						await _instance.cloudClient.clientCommand('push', {
							location,
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
