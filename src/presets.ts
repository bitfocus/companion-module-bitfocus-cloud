import { CompanionButtonPresetDefinition, CompanionPresetDefinitions, InstanceStatus } from '@companion-module/base'
import { ActionId } from './actions'
import { CloudConfig } from './config'
import { FeedbackId } from './feedback'
import { CreateBankControlId, InstanceBaseExt } from './utils'

interface CompanionPresetExt extends CompanionButtonPresetDefinition {
	feedbacks: Array<
		{
			feedbackId: FeedbackId
		} & CompanionButtonPresetDefinition['feedbacks'][0]
	>
	steps: Array<{
		down: Array<
			{
				actionId: ActionId
			} & CompanionButtonPresetDefinition['steps'][0]['down'][0]
		>
		up: Array<
			{
				actionId: ActionId
			} & CompanionButtonPresetDefinition['steps'][0]['up'][0]
		>
	}>
}
interface CompanionPresetDefinitionsExt {
	[id: string]: CompanionPresetExt | undefined
}
export function GetPresetList(_instance: InstanceBaseExt<CloudConfig>): CompanionPresetDefinitions {
	let presets: CompanionPresetDefinitionsExt = {}

	if (_instance.cloudState !== InstanceStatus.Ok && _instance.cloudState !== InstanceStatus.UnknownWarning) {
		return presets
	}

	for (let page = 1; page <= 99; page++) {
		for (let bank = 1; bank <= 32; bank++) {
			const controlId = CreateBankControlId(page, bank)
			const bankCache = _instance.bankCache[controlId]?.data || {}
			const preset: CompanionPresetExt = {
				name: `Page ${page} Bank ${bank}`,
				style: {
					text: bankCache.text || '',
					size: bankCache.size,
					color: bankCache.color,
					bgcolor: bankCache.bgcolor,
					alignment: bankCache.alignment,
					png64: bankCache.png64,
					cloud: true,
				} as any,
				type: 'button',
				category: 'Page ' + (page),
				feedbacks: [
					{
						feedbackId: 'change',
						options: {
							page: page,
							bank: bank,
						},
					},
				],
				steps: [
					{
						down: [
							{
								actionId: ActionId.buttonDown,
								options: {
									page: page,
									bank: bank,
								},
							},
						],
						up: [
							{
								actionId: ActionId.buttonUp,
								options: {
									page: page,
									bank: bank,
								},
							},
						],
					},
				],
			}

			presets[controlId] = preset
		}
	}

	return presets
}
