module.exports = {

	/**
	 * Get the available feedbacks.
	 * 
	 * !!! Utilized by bmd-multiview16 !!!
	 *
	 * @returns {Object[]} the available feedbacks
	 * @access public
	 * @since 1.2.0
	 */
	getFeedbacks() {
		var feedbacks = {};

		feedbacks['main'] = {
			label: 'Follow remote key',
			description: 'Follows the remote bank',
			options: [
				{
					type: 'textinput',
					label: 'Page',
					id: 'page',
					default: 1
				},
				{
					type: 'textinput',
					label: 'Bank',
					id: 'bank',
					default: 1
				}
			],
			callback: (feedback, bank) => {
				if (this.banks && this.banks[feedback.options.page] && this.banks[feedback.options.page][feedback.options.bank]) {
					return this.banks[feedback.options.page][feedback.options.bank];
				}
			}
		};

		return feedbacks;
	}
}