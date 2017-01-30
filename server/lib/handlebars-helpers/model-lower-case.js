export default function (instance) {

	return !Array.isArray(instance) ?
		instance.constructor.name.toLowerCase() :
		`${instance[0].constructor.name.toLowerCase()}s`;

};
