module.exports = {

	/**
	 * INTERNAL: initialize presets.
	 *
	 * @access protected
	 * @since 1.1.1
	 */
	initPresets () {
		var presets = [];

		for (let i = 1; i <= 99; ++i) {
			for (let j = 1; j < 32; ++j) {
				presets.push(
					{
						label: 'Bank ' + i + '.' + j,
						category: 'Page ' + i,
						bank: {
							...(this.banks[i] && this.banks[i][j] ? this.banks[i][j] : {}),
						},
						feedbacks: [
							{
								type: 'main',
								options: {
									page: i,
									bank: j
								},
								style: {}
							}
						],
						actions: [
							{
								action: 'push',
								options: {
									page: i,
									bank: j
								}
							}
						],
						release_actions: [
							{
								action: 'release',
								options: {
									page: i,
									bank: j
								}
							}
						]
					}
				);
			}
		}

		this.setPresetDefinitions(presets);
	}
}