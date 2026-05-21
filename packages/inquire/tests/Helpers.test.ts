import { describe, it } from 'mocha';
import { expect } from 'chai';
//NOTE: no extensions in tests because it's excluded in tsconfig.json and
//we are testing in a typescript environment via `ts-mocha -r tsx` (esm)
import Exception from '../src/Exception';
import {
  backSlashes,
  doubleQuotes,
  escapeBackSlashes,
  escapeDoubleQuotes,
  isIndex,
  joinTypes,
  jsonCompare,
  safeJsonValue
} from '../src/helpers';

describe('Helper Tests', () => {
  it('Should escape JSON-sensitive string values', () => {
    //Use simple inputs so each escaping rule is easy to verify.
    const slashValue = 'C:\\path';
    const quoteValue = '"quoted"';
    const safeValue = 'C:\\path "quoted"';

    //Run each helper directly so the coverage reflects the exported API.
    const withSlashes = escapeBackSlashes(slashValue);
    const withQuotes = escapeDoubleQuotes(quoteValue);
    const safeJson = safeJsonValue(safeValue);

    //Confirm each helper only applies the escaping it owns.
    expect(withSlashes).to.equal('C:\\\\path');
    expect(withQuotes).to.equal('\\"quoted\\"');
    expect(safeJson).to.equal('C:\\\\path \\"quoted\\"');
  });

  it('Should expose the shared helper constants and compare JSON values', () => {
    //Exercise the exported regex helpers and join mapping directly.
    expect(joinTypes.full_outer).to.equal('FULL OUTER');
    expect(isIndex.test('12')).to.equal(true);
    expect(isIndex.test('id')).to.equal(false);
    expect('a\\b'.replace(backSlashes, '/')).to.equal('a/b');
    expect('"a"'.replace(doubleQuotes, '\'')).to.equal('\'a\'');

    //Cover both the equal and not-equal comparison branches.
    expect(jsonCompare({ id: 1, tags: [ 'a' ] }, { id: 1, tags: [ 'a' ] }))
      .to.equal(true);
    expect(jsonCompare({ id: 1 }, { id: 2 })).to.equal(false);
  });

  it('Should expose the custom exception class', () => {
    //Instantiate the package-specific error directly.
    const error = new Exception('Coverage error');

    //Confirm callers receive the package-specific exception type.
    expect(error).to.be.instanceOf(Exception);
    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.equal('Coverage error');
  });
});
