import React, { Component } from 'react';

import { Footer, Head, Header, InstanceLabel, Navigation, PageTitle } from '.';

export default class App extends Component {

	render () {

		const { documentTitle, pageTitle, model, children } = this.props;

		return (
			<html>

				<Head documentTitle={documentTitle} />

				<body>

					<div className="page-container">

						<Header />

						<Navigation />

						<main className="main-content">

							{
								model && (
									<InstanceLabel text={model} />
								)
							}

							<PageTitle text={pageTitle} />

							{ children }

						</main>

						<Footer />

					</div>

				</body>

			</html>
		);

	}

}