module.exports = {

	/**
	 * Get the available actions.
	 * 
	 * !!! Utilized by bmd-multiview16 !!!
	 *
	 * @returns {Object[]} the available actions
	 * @access public
	 * @since 1.2.0
	 */
	getActions() {
		var actions = {};

		actions['push'] = {
			label: 'Push remote key down',
			options: [
				{
					type: 'textinput',
					label: 'Page',
					id: 'page',
					default: '1'
				},
				{
					type: 'textinput',
					label: 'Bank',
					id: 'bank',
					default: "1"
				}
			]
		};

		actions['release'] = {
			label: 'Release remote key',
			options: [
				{
					type: 'textinput',
					label: 'Page',
					id: 'page',
					default: '1'
				},
				{
					type: 'textinput',
					label: 'Bank',
					id: 'bank',
					default: "1"
				}
			]
		};

		return actions;
	}
}
