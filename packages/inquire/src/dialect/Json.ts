export const pattern = '([a-zA-Z0-9_]+(\\.[a-zA-Z0-9_]+)'
  + '{0,1}\\%s[a-zA-Z0-9_]+(\\%s[a-zA-Z0-9_]+)*)';

export default abstract class JsonTrait {
  //Recommended quote character
  public abstract q: string;

  //used for json notation
  protected _separator: string = '.';
  protected _splitter: string = ':';
  //jsonic pattern
  protected _pattern = pattern
    .replace('%s', this._splitter)
    .replace('%s', this._separator);
  // - ex. data:info.name
  // - ex. profile.data:info
  // - ex. profile.data:info.name
  protected _replace = new RegExp(this._pattern, 'g');
  protected _jsonic = new RegExp(`^${this._pattern}$`, 'g');

  /**
   * Returns json separator (.)
   */
  public get separator() {
    return this._separator;
  }

  /**
   * Returns json splitter (:)
   */
  public get splitter() {
    return this._splitter;
  }

  /**
   * Sets json separator and updates jsonic regex pattern
   */
  public set separator(separator: string) {
    this._separator = separator;
    this._pattern = pattern
      .replace('%s', this._splitter)
      .replace('%s', this._separator);
  }

  /**
   * Sets json splitter and updates jsonic regex pattern
   */
  public set splitter(splitter: string) {
    this._splitter = splitter;
    this._pattern = pattern
      .replace('%s', this._splitter)
      .replace('%s', this._separator);
  }
  
  protected _isJsonic(selector: string) {
    const regexp = new RegExp(`^${this._pattern}$`, 'g');
    return regexp.test(selector);
  }

  /**
   * Replaces JSON selectors in the given clause 
   * with the corresponding json sql syntax.
   */
  protected abstract _jsonReplace(clause: string): string;
};