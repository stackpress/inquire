import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Connection from '../src/Connection';

describe('Connection Test', () => {
    // Line 29
    it('Should return the correct value for lastId when _lastId is set to a positive integer', () => {
        const mockResource = {} as any;
        const connection = new Connection(mockResource);
        connection['_lastId'] = 42; 
        const lastId = connection.lastId;
        expect(lastId).to.equal(42);
    });

    // Line 44
    it('Should handle a request object with no values property', () => {
        const mockResource = {} as any;
        const connection = new Connection(mockResource);
        const request = {
            query: 'SELECT * FROM table'
        };
        const formatted = connection.format(request);
        expect(formatted.values).to.deep.equal([]);
    });
    
    // Line 49    
    it('should convert Date objects in the values array to ISO string format', () => {
        const mockResource = {} as any;
        const connection = new Connection(mockResource);
        const date = new Date('2023-10-05T14:48:00.000Z');
        const request = {
        query: 'SELECT * FROM table WHERE date = ?',
        values: [date]
        };
        const formatted = connection.format(request);
        expect(formatted.values[0]).to.equal(date.toISOString());
    });

    // Line 51
    it('Should handle an empty array by converting it to an empty JSON array string', () => {
        const mockResource = {} as any;
        const connection = new Connection(mockResource);
        const request = {
            query: 'SELECT * FROM table WHERE data = ?',
            values: [[]]
        };
        const formatted = connection.format(request);
        expect(formatted.values[0]).to.equal('[]');
    });

    // Line 53
    it('Should convert a nested object in the values array to a JSON string', () => {
        const mockResource = {} as any;
        const connection = new Connection(mockResource);
        const nestedObject = { key: { nestedKey: 'nestedValue' } };
        const request = {
            query: 'INSERT INTO table (data) VALUES (?)',
            values: [nestedObject]
        };
        const formatted = connection.format(request);
        expect(formatted.values[0]).to.equal(JSON.stringify(nestedObject));
    });

    // Line 67 - 69
    it('Should set _lastId when results[0] is an object with insertId property and not an array', async () => {
        const mockResource = {
            execute: async () => [{ insertId: 123 }]
        } as any;
        const connection = new Connection(mockResource);
        const request = {
            query: 'INSERT INTO table (column) VALUES (?)',
            values: ['value']
        };
        await connection.query(request);
        expect(connection.lastId).to.equal(123);
    });

    // Line 70
    it('Should return an empty array when results is an empty array', async () => {
        const mockResource = {
            execute: async () => [[]]
        } as any;
        const connection = new Connection(mockResource);
        const request = {
            query: 'SELECT * FROM table',
            values: []
        };
        const results = await connection.query(request);
        expect(results).to.deep.equal([]);
    });

    // Line 88 - 90
    it('Should successfully execute the callback and commit when both operations succeed', async () => {
        const mockResource = {
            beginTransaction: async () => {},
            commit: async () => { mockResource.commit.calledOnce = true; }
        } as any;
        const connection = new Connection(mockResource);
        const callback = async (conn: any) => {
            return ['success'];
        };
        const results = await connection.transaction(callback);
        expect(results).to.deep.equal(['success']);
        expect(mockResource.commit.calledOnce).to.be.true;
    });

    // Line 91 - 93
    it('Should handle and rollback transaction when beginTransaction throws an error', async () => {
    const mockResource = {
        beginTransaction: async () => { throw new Error('Transaction error'); },
        rollback: async () => { mockResource.rollback.calledOnce = true; }
    } as any;
    const connection = new Connection(mockResource);
    const callback = async () => { return []; };
    try {
        await connection.transaction(callback);
    } catch (e) {
        expect(e.message).to.equal('Transaction error');
    }
    expect(mockResource.rollback.calledOnce).to.be.true;
    });

    // Line 103 - 104
    it('Should return results as Results<R> when results[0] is an array using lowercase isarray method', async () => {
    const mockResource = {
        execute: async () => [[{ id: 1, name: 'test' }]]
    } as any;
    const connection = new Connection(mockResource);
    const request = {
        query: 'SELECT * FROM table',
        values: []
    };
    const results = await connection.raw(request);
    expect(results).to.deep.equal([[{ id: 1, name: 'test' }]]);
    });
        
    

});
