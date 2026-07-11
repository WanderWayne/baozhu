/** @feature intro @see docs/features/intro.md */
const IntroSystem = require('./intro-core');

require('./intro-particles')(IntroSystem);
require('./intro-render')(IntroSystem);
require('./intro-text')(IntroSystem);
require('./intro-items')(IntroSystem);
require('./intro-states-early')(IntroSystem);
require('./intro-states-late')(IntroSystem);

module.exports = IntroSystem;
