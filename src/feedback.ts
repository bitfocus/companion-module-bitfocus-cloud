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
import { CompanionFeedbackDefinitions, CompanionAdvancedFeedbackDefinition } from '@companion-module/base'
import { CloudConfig } from './config.js'
import { CreateLocationFromLocationText, CreateModuleControlId, InstanceBaseExt } from './utils.js'
import { cloneDeep } from 'lodash'

export type FeedbackId = 'change'

export const CopyButtonStyleProperties = [
	{ id: 'text', label: 'Text' },
	{ id: 'size', label: 'Font Size' },
	{ id: 'png64', label: 'PNG' },
	{ id: 'alignment', label: 'Text Alignment' },
	{ id: 'pngalignment', label: 'PNG Alignment' },
	{ id: 'color', label: 'Color' },
	{ id: 'bgcolor', label: 'Background' },
]

export function GetFeedbacks(instance: InstanceBaseExt<CloudConfig>): CompanionFeedbackDefinitions {
	const feedbacks: { change: CompanionAdvancedFeedbackDefinition | undefined } = {
		['change']: {
			type: 'advanced',
			name: 'remote change',
			description: 'Keep up to date with remote button changes',
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
				{
					type: 'dropdown',
					label: 'Filter by properties',
					id: 'filter_enabled',
					default: 'no',
					choices: [
						{ id: 'no', label: 'No filter' },
						{ id: 'yes', label: 'Only selected properties' },
					],
				},
				{
					id: 'filter',
					label: 'Properties',
					type: 'multidropdown',
					minSelection: 1,
					choices: CopyButtonStyleProperties,
					default: CopyButtonStyleProperties.map((p) => p.id),
					isVisible: (options) => options.filter_enabled === 'yes',
				},
			],
			callback: (feedback) => {
				const remoteControl = CreateLocationFromLocationText(
					feedback.options.location_text ? String(feedback.options.location_text) : ''
				)
				const remoteControlId = CreateModuleControlId(remoteControl)

				if (instance.bankCache[remoteControlId]) {
					if (typeof instance.bankCache[remoteControlId]?.data === 'object') {
						const data = cloneDeep(instance.bankCache[remoteControlId].data)
						delete data.show_topbar

						if (feedback.options.filter_enabled === 'yes') {
							const filter = feedback.options.filter as string[]
							const newData: { [key: string]: any } = {}
							for (const key of filter) {
								newData[key] = data[key]
							}
							return { ...newData, cloud: true }
						} else {
							return { ...data, cloud: true }
						}
					}
				}

				return { text: '', cloud: true, cloud_error: true }
			},
			subscribe: (feedback) => {
				const location = CreateLocationFromLocationText(
					feedback.options.location_text ? String(feedback.options.location_text) : ''
				)
				const remoteControlId = CreateModuleControlId(location)

				instance.feedbackForControl[remoteControlId] = {
					location,
					feedbackIds: [...(instance.feedbackForControl[remoteControlId]?.feedbackIds || []), feedback.id],
				}
			},
			unsubscribe: (feedback) => {
				const location = CreateLocationFromLocationText(
					feedback.options.location_text ? String(feedback.options.location_text) : ''
				)
				const remoteControlId = CreateModuleControlId(location)
				instance.feedbackForControl[remoteControlId] = {
					...instance.feedbackForControl[remoteControlId],
					feedbackIds: (instance.feedbackForControl[remoteControlId]?.feedbackIds || []).filter(
						(id: string) => id !== feedback.id
					),
				}
				if (instance.feedbackForControl[remoteControlId].feedbackIds.length === 0) {
					delete instance.feedbackForControl[remoteControlId]
				}
			},
		},
	}

	return feedbacks
}
