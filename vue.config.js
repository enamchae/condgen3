module.exports = {
	// currently nonfunctional
	chainWebpack: config => {
		config.module
				.rule("vue")
				.use("vue-loader")
				.tap(options => {
					options.compilerOptions.isCustomElement = tagName => false;
					return options;
				});
	},
};