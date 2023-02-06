import { CompanionButtonPresetDefinition, CompanionPresetDefinitions } from '@companion-module/base'
import { ActionId } from './actions'
import { FeedbackId } from './feedback'

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
export function GetPresetList(): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitionsExt = {}

	return presets
}
