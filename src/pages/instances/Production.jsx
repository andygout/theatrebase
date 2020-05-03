import { h } from 'preact';

import { App, InstanceFacet, InstanceLink, List } from '../../components';

export default function (props) {

	const { documentTitle, pageTitle, production } = props;

	const { model, theatre, playtext, cast } = production;

	return (
		<App documentTitle={documentTitle} pageTitle={pageTitle} model={model}>

			{
				theatre && (
					<InstanceFacet labelText='Theatre'>

						<InstanceLink instance={theatre} />

					</InstanceFacet>
				)
			}

			{
				playtext && (
					<InstanceFacet labelText='Playtext'>

						<InstanceLink instance={playtext} />

					</InstanceFacet>
				)
			}

			{
				cast && cast.length > 0 && (
					<InstanceFacet labelText='Cast'>

						<List instances={cast} />

					</InstanceFacet>
				)
			}

		</App>
	);

};
