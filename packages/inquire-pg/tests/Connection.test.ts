import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Connection from '../src/Connection';

describe('Connection Test', () => {
    // Line 36
    it('Should throw an exception when the query string does not contain a question mark', () => {
        const resource = { query: () => Promise.resolve({ rows: [] }) };
        const connection = new Connection(resource as any);
        const request = { query: 'SELECT * FROM users', values: ['value1'] };
        expect(() => connection.format(request)).to.throw('Query does not match the number of values.');
    });

    // Line 45
    it('Should convert a Date object in the values array to an ISO string', () => {
        const resource = { query: () => Promise.resolve({ rows: [] }) };
        const connection = new Connection(resource as any);
        const date = new Date('2023-10-05T14:48:00.000Z');
        const request = { query: 'INSERT INTO events (event_date) VALUES (?)', values: [date] };
        const formatted = connection.format(request);
        expect(formatted.values[0]).to.equal(date.toISOString());
    });

    // Line 47
    it('Should convert an array in the values array to a JSON string', () => {
        const resource = { query: () => Promise.resolve({ rows: [] }) };
        const connection = new Connection(resource as any);
        const arrayValue = [1, 2, 3];
        const request = { query: 'INSERT INTO numbers (num_array) VALUES (?)', values: [arrayValue] };
        const formatted = connection.format(request);
        expect(formatted.values[0]).to.equal(JSON.stringify(arrayValue));
    });

    // Line 49
    it('Should convert an object with nested properties in the values array to a JSON string', () => {
        const resource = { query: () => Promise.resolve({ rows: [] }) };
        const connection = new Connection(resource as any);
        const nestedObject = { key1: 'value1', key2: { nestedKey: 'nestedValue' } };
        const request = { query: 'INSERT INTO data (json_column) VALUES (?)', values: [nestedObject] };
        const formatted = connection.format(request);
        expect(formatted.values[0]).to.equal(JSON.stringify(nestedObject));
    });

    // Line 53
    it('Should throw an exception when the query string contains multiple question marks', () => {
        const resource = { query: () => Promise.resolve({ rows: [] }) };
        const connection = new Connection(resource as any);
        const request = { query: 'SELECT * FROM users WHERE name = ? AND age = ?', values: ['John'] };
        expect(() => connection.format(request)).to.throw('Query does not match the number of values.');
    });

    // Line 67 - 68
    it('Should return an empty array when the query returns no rows', async () => {
        const resource = { query: () => Promise.resolve({ rows: [] }) };
        const connection = new Connection(resource as any);
        const request = { query: 'SELECT * FROM users WHERE id = ?', values: [1] };
        const result = await connection.query(request);
        expect(result).to.be.an('array').that.is.empty;
    });

    // Line 86 - 89
    it('Should successfully commit the transaction when the callback resolves without errors', async () => {
        const mockResource = {
            query: async (query: string) => {
                if (query === 'COMMIT') {
                    mockResource.commitCalled = true;
                }},
            commitCalled: false} as any;
        const connection = new Connection(mockResource);
        const callback = async () => { return ['result1', 'result2']; };
        const results = await connection.transaction(callback);
        expect(results).to.deep.equal(['result1', 'result2']);
        expect(mockResource.commitCalled).to.be.true;
    });

    // Line 90 - 91
    it('Should handle and rollback transaction when beginTransaction throws an error', async () => {
        const mockResource = {
            query: async (query: string) => {
                if (query === 'BEGIN') {
                    throw new Error('Transaction error');
                }
                if (query === 'ROLLBACK') {
                    mockResource.rollbackCalled = true;
                }},
            rollbackCalled: false} as any;
        const connection = new Connection(mockResource);
        const callback = async () => { return []; };
        try {
            await connection.transaction(callback);
        } catch (e) {
            expect(e.message).to.equal('Transaction error');
        }
        expect(mockResource.rollbackCalled).to.be.true;
    });


    // Line 99 - 100
    it('Should handle a query with no values and return the expected result', async () => {
        const expectedResult = { rows: [{ id: 1, name: 'Test User' }] };
        const resource = { query: () => Promise.resolve(expectedResult) };
        const connection = new Connection(resource as any);
        const request = { query: 'SELECT * FROM users' };
        const result = await connection['_query'](request);
        expect(result).to.deep.equal(expectedResult);
    });


});