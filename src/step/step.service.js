export default StepService;
import _ from 'lodash';

/** @ngInject */
function StepService(Choice, $log, $rootScope) {
  // Symbols declarion for private attributes and methods
  const _meta = Symbol('meta');
  const _game = Symbol('game');
  const _choices = Symbol('choices');
  const _slice = Symbol('_slice');

  class Step {
    constructor(meta, game) {
      this[_game] = game;
      this[_meta] = angular.copy(meta);
      // Create choices
      this[_choices] = this[_meta].choices.map(meta => new Choice(meta, this));
      // Ensure those method arround bound to the current instance
      ['nextSlice', 'select', 'isLastSlice', 'isCurrent', 'hasCondition'].forEach(m => {
        this[m] = this[m].bind(this);
      });
    }
    hasCondition() {
      return this[_meta].hasOwnProperty('condition');
    }
    isCurrent() {
      return this.game.step === this;
    }
    isLastSlice() {
      return this.slice === this.text.length - 1;
    }
    select(choice) {
      this.game.select(choice);
      // Add info to the log
      $log.info('Step %s: choice %s', this.index, choice.index);
    }
    nextSlice() {
      this.slice = this.slice + 1;
      // Broadcast the event about this slice
      $rootScope.$broadcast('game:step:slice:next', this);
    }
    // Express reading time of the current slice in milliseconds
    get readingTime() {
      // We read approximativly 270 word per minute
      return this.lastSlice.split(' ').length * 60 / 270 * 1000;
    }
    set slice(val) {
      this[_slice] = Math.max(0, Math.min(this.text.length - 1, val));
    }
    get slice() {
      return this[_slice] || 0;
    }
    get lastSlice() {
      return this.text[this.slice];
    }
    get assert() {
      // Minimum value condition
      if (this.condition.hasOwnProperty('min')) {
        return this.game.var(this.condition.var).value >= this.condition.min;
      // Maximum value condition
      } else if (this.condition.hasOwnProperty('max')) {
        return this.game.var(this.condition.var).value <= this.condition.max;
      }
      // No condition (or unkown)
      return true;
    }
    get choices() {
      return this[_choices];
    }
    get selection() {
      return _.find(this.game.history, {step: this});
    }
    get index() {
      return this.game.steps.indexOf(this);
    }
    get year() {
      return Number(this[_meta].year);
    }
    get text() {
      return _.castArray(this[_meta]['text@en'] || null);
    }
    get game() {
      return this[_game];
    }
    get condition() {
      return this[_meta].condition || {};
    }
  }
  return Step;
}