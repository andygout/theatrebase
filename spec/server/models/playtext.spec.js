const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const dbQueryFixture = require('../../fixtures/db-query');

const sandbox = sinon.sandbox.create();

let stubs;
let instance;

beforeEach(() => {

	stubs = {
		dbQuery: sandbox.stub().resolves(dbQueryFixture),
		cypherTemplatesShared: {
			getValidateUpdateQuery: sandbox.stub().returns('getValidateUpdateQuery response'),
			getEditQuery: sandbox.stub().returns('getEditQuery response'),
			getUpdateQuery: sandbox.stub().returns('getUpdateQuery response'),
			getDeleteQuery: sandbox.stub().returns('getDeleteQuery response'),
			getListQuery: sandbox.stub().returns('getListQuery response')
		},
		cypherTemplatesPlaytext: {
			getShowQuery: sandbox.stub().returns('getShowQuery response')
		},
		trimStrings: sandbox.stub(),
		validateString: sandbox.stub().returns([]),
		verifyErrorPresence: sandbox.stub().returns(false)
	};

	instance = createInstance();

});

afterEach(() => {

	sandbox.restore();

});

const createSubject = (stubOverrides = {}) =>
	proxyquire('../../../dist/models/playtext', {
		'../database/db-query': stubOverrides.dbQuery || stubs.dbQuery,
		'../lib/cypher-templates/shared': stubs.cypherTemplatesShared,
		'../lib/cypher-templates/playtext': stubs.cypherTemplatesPlaytext,
		'../lib/trim-strings': stubs.trimStrings,
		'../lib/validate-string': stubOverrides.validateString || stubs.validateString,
		'../lib/verify-error-presence': stubOverrides.verifyErrorPresence || stubs.verifyErrorPresence
	});

const createInstance = (stubOverrides = {}) => {

	const subject = createSubject(stubOverrides);

	return new subject({ title: 'Hamlet' });

};

describe('Playtext model', () => {

	describe('validate method', () => {

		it('will trim strings before validating title', () => {

			instance.validate();
			expect(stubs.trimStrings.calledBefore(stubs.validateString)).to.be.true;
			expect(stubs.trimStrings.calledOnce).to.be.true;
			expect(stubs.trimStrings.calledWithExactly(instance)).to.be.true;
			expect(stubs.validateString.calledOnce).to.be.true;
			expect(stubs.validateString.calledWithExactly(instance.title, 'Title', {})).to.be.true;

		});

		context('valid data', () => {

			it('will not add properties to errors property', () => {


				instance.validate();
				expect(instance.errors).not.to.have.property('title');
				expect(instance.errors).to.deep.eq({});

			});

		});

		context('invalid data', () => {

			it('will add properties that are arrays to errors property', () => {

				instance = createInstance({ validateString: sinon.stub().returns(['Title is too short']) });
				instance.validate();
				expect(instance.errors)
					.to.have.property('title')
					.that.is.an('array')
					.that.deep.eq(['Title is too short']);

			});

		});

	});

	describe('validateUpdateInDb method', () => {

		it('will validate update in database', done => {

			instance.validateUpdateInDb().then(() => {
				expect(stubs.cypherTemplatesShared.getValidateUpdateQuery.calledOnce).to.be.true;
				expect(stubs.cypherTemplatesShared.getValidateUpdateQuery.calledWithExactly(instance.model)).to.be.true;
				expect(stubs.dbQuery.calledOnce).to.be.true;
				expect(stubs.dbQuery.calledWithExactly(
					{ query: 'getValidateUpdateQuery response', params: instance }
				)).to.be.true;
				done();
			});

		});

		context('valid data (results returned that indicate title does not already exist)', () => {

			it('will not add properties to errors property', done => {

				instance = createInstance({ dbQuery: sinon.stub().resolves({ playtextCount: 0 }) });
				instance.validateUpdateInDb().then(() => {
					expect(instance.errors).not.to.have.property('title');
					expect(instance.errors).to.deep.eq({});
					done();
				});

			});

		});

		context('invalid data (results returned that indicate title already exists)', () => {

			it('will add properties that are arrays to errors property', done => {

				instance = createInstance({ dbQuery: sinon.stub().resolves({ playtextCount: 1 }) });
				instance.validateUpdateInDb().then(() => {
					expect(instance.errors)
						.to.have.property('title')
						.that.is.an('array')
						.that.deep.eq(['Title already exists']);
					done();
				});

			});

		});

	});

	describe('edit method', () => {

		it('will get edit data', done => {

			instance.edit().then(result => {
				expect(stubs.cypherTemplatesShared.getEditQuery.calledOnce).to.be.true;
				expect(stubs.cypherTemplatesShared.getEditQuery.calledWithExactly(instance.model)).to.be.true;
				expect(stubs.dbQuery.calledOnce).to.be.true;
				expect(stubs.dbQuery.calledWithExactly(
					{ query: 'getEditQuery response', params: instance }
				)).to.be.true;
				expect(result).to.deep.eq(dbQueryFixture);
				done();
			});

		});

	});

	describe('update method', () => {

		context('valid data', () => {

			it('will update', done => {


				sinon.spy(instance, 'validate');
				sinon.spy(instance, 'validateUpdateInDb');
				instance.update().then(result => {
					sinon.assert.callOrder(
						instance.validate.withArgs({ required: true }),
						stubs.verifyErrorPresence.withArgs(instance),
						instance.validateUpdateInDb.withArgs(),
						stubs.cypherTemplatesShared.getValidateUpdateQuery.withArgs(instance.model),
						stubs.dbQuery.withArgs({ query: 'getValidateUpdateQuery response', params: instance }),
						stubs.verifyErrorPresence.withArgs(instance),
						stubs.cypherTemplatesShared.getUpdateQuery.withArgs(instance.model),
						stubs.dbQuery.withArgs({ query: 'getUpdateQuery response', params: instance })
					);
					expect(instance.validate.calledOnce).to.be.true;
					expect(stubs.verifyErrorPresence.calledTwice).to.be.true;
					expect(instance.validateUpdateInDb.calledOnce).to.be.true;
					expect(stubs.cypherTemplatesShared.getValidateUpdateQuery.calledOnce).to.be.true;
					expect(stubs.dbQuery.calledTwice).to.be.true;
					expect(stubs.cypherTemplatesShared.getUpdateQuery.calledOnce).to.be.true;
					expect(result).to.deep.eq(dbQueryFixture);
					done();
				});

			});

		});

		context('invalid data', () => {

			context('initial validation errors caused by submitted values', () => {

				it('will return instance without updating', done => {

					const verifyErrorPresenceStub = sinon.stub().returns(true);
					instance = createInstance({ verifyErrorPresence: verifyErrorPresenceStub });
					sinon.spy(instance, 'validate');
					sinon.spy(instance, 'validateUpdateInDb');
					instance.update().then(result => {
						expect(instance.validate.calledBefore(verifyErrorPresenceStub)).to.be.true;
						expect(instance.validate.calledOnce).to.be.true;
						expect(instance.validate.calledWithExactly({ required: true })).to.be.true;
						expect(verifyErrorPresenceStub.calledOnce).to.be.true;
						expect(verifyErrorPresenceStub.calledWithExactly(instance)).to.be.true;
						expect(instance.validateUpdateInDb.notCalled).to.be.true;
						expect(stubs.cypherTemplatesShared.getValidateUpdateQuery.notCalled).to.be.true;
						expect(stubs.dbQuery.notCalled).to.be.true;
						expect(stubs.cypherTemplatesShared.getUpdateQuery.notCalled).to.be.true;
						expect(result).to.deep.eq({ playtext: instance });
						done();
					});

				});

			});

			context('secondary validation errors caused by database checks', () => {

				it('will return instance without updating', done => {

					const verifyErrorPresenceStub = sinon.stub();
					verifyErrorPresenceStub.onFirstCall().returns(false).onSecondCall().returns(true);
					instance = createInstance({ verifyErrorPresence: verifyErrorPresenceStub });
					sinon.spy(instance, 'validate');
					sinon.spy(instance, 'validateUpdateInDb');
					instance.update().then(result => {
						sinon.assert.callOrder(
							instance.validate.withArgs({ required: true }),
							verifyErrorPresenceStub.withArgs(instance),
							instance.validateUpdateInDb.withArgs(),
							stubs.cypherTemplatesShared.getValidateUpdateQuery.withArgs(instance.model),
							stubs.dbQuery.withArgs({ query: 'getValidateUpdateQuery response', params: instance }),
							verifyErrorPresenceStub.withArgs(instance)
						);
						expect(instance.validate.calledOnce).to.be.true;
						expect(verifyErrorPresenceStub.calledTwice).to.be.true;
						expect(instance.validateUpdateInDb.calledOnce).to.be.true;
						expect(stubs.cypherTemplatesShared.getValidateUpdateQuery.calledOnce).to.be.true;
						expect(stubs.dbQuery.calledOnce).to.be.true;
						expect(stubs.cypherTemplatesShared.getUpdateQuery.notCalled).to.be.true;
						expect(result).to.deep.eq({ playtext: instance });
						done();
					});

				});

			});

		});

	});

	describe('delete method', () => {

		it('will delete', done => {

			instance.delete().then(result => {
				expect(stubs.cypherTemplatesShared.getDeleteQuery.calledOnce).to.be.true;
				expect(stubs.cypherTemplatesShared.getDeleteQuery.calledWithExactly(instance.model)).to.be.true;
				expect(stubs.dbQuery.calledOnce).to.be.true;
				expect(stubs.dbQuery.calledWithExactly(
					{ query: 'getDeleteQuery response', params: instance }
				)).to.be.true;
				expect(result).to.deep.eq(dbQueryFixture);
				done();
			});

		});

	});

	describe('show method', () => {

		it('will get show data', done => {

			instance.show().then(result => {
				expect(stubs.cypherTemplatesPlaytext.getShowQuery.calledOnce).to.be.true;
				expect(stubs.cypherTemplatesPlaytext.getShowQuery.calledWithExactly()).to.be.true;
				expect(stubs.dbQuery.calledOnce).to.be.true;
				expect(stubs.dbQuery.calledWithExactly(
					{ query: 'getShowQuery response', params: instance }
				)).to.be.true;
				expect(result).to.deep.eq(dbQueryFixture);
				done();
			});

		});

	});

	describe('list method', () => {

		it('will get list data', done => {

			const subject = createSubject();
			subject.list().then(result => {
				expect(stubs.cypherTemplatesShared.getListQuery.calledOnce).to.be.true;
				expect(stubs.cypherTemplatesShared.getListQuery.calledWithExactly('playtext')).to.be.true;
				expect(stubs.dbQuery.calledOnce).to.be.true;
				expect(stubs.dbQuery.calledWithExactly({ query: 'getListQuery response' })).to.be.true;
				expect(result).to.deep.eq(dbQueryFixture);
				done();
			});

		});

	});

});
