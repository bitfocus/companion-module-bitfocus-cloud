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
import { CloudConfig } from './config'
import { CreateBankControlId, InstanceBaseExt } from './utils'

export type FeedbackId = 'change'

export function GetFeedbacks(instance: InstanceBaseExt<CloudConfig>): CompanionFeedbackDefinitions {
	const feedbacks: { change: CompanionAdvancedFeedbackDefinition | undefined } = {
		['change']: {
			type: 'advanced',
			name: 'remote change',
			description: 'Keep up to date with remote button changes',
			options: [
				{
					type: 'number',
					label: 'Page',
					id: 'page',
					default: 1,
					min: 1,
					max: 99, // TODO: Get max pages from remote instance
				},
				{
					type: 'number',
					label: 'Bank',
					id: 'bank',
					default: 1,
					min: 1,
					max: 32, // TODO: Get max banks from remote instance
				},
			],
			callback: (feedback) => {
				const remoteControlId = CreateBankControlId(Number(feedback.options.page), Number(feedback.options.bank))

				if (instance.bankCache[remoteControlId]) {
					if (typeof instance.bankCache[remoteControlId]?.data === 'object') {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { show_topbar, ...rest } = instance.bankCache[remoteControlId].data
						return { ...rest, cloud: true }
					}
				}

				return { cloud: true }
			},
			subscribe: (feedback) => {
				const remoteControlId = CreateBankControlId(Number(feedback.options.page), Number(feedback.options.bank))

				instance.bankCache[remoteControlId] = {
					...instance.bankCache[remoteControlId],
					feedbackIds: [...(instance.bankCache[remoteControlId]?.feedbackIds || []), feedback.id],
				}
			},
			unsubscribe: (feedback) => {
				const remoteControlId = CreateBankControlId(Number(feedback.options.page), Number(feedback.options.bank))
				instance.bankCache[remoteControlId] = {
					...instance.bankCache[remoteControlId],
					feedbackIds: (instance.bankCache[remoteControlId]?.feedbackIds || []).filter(
						(id: string) => id !== feedback.id
					),
				}
			},
		},
	}

	return feedbacks
}
