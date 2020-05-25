/**
* @overview A JavaScript prototype for creating world clocks.
* @requires jQuery
* @requires moment
* @requires moment-timezone
* @author Bart Busschots & D. Rendon
* @license BSD-2-Clause
*/

/* Modified for PBS26 Assignment 25-Oct-2016 */
/* Modified for PBS92 Homework 28-Mar-2020 */
/* Converted into JavaScript class 24-Apr-2020
/* Class accessors added 08-May-2020
//
// === Add needed JSDoc data type definitions ===
//

/**
* A TZ string from the [IANA Time Zone Database](https://en.wikipedia.org/wiki/Tz_database).
* A full list of the valid strings can be found in the
* [third column of this listing}(https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
* @typedef {string} TimeZoneString
*/

/**
* A jQuery object.
* @typedef {object} jQuery
*/

/**
* A jQuery object representing exactly one HTML span element.
* @typedef {jQuery} jQuerySingleSpan
*/

// make sure the needed pre-requisites are installed.
if(typeof jQuery !== 'function'){
    throw new Error('jQuery is required but not loaded');
}

class WorldClock {
  
  // =============================================================================
  // define the constructor
  // =============================================================================
  /**
  * @param {jQuerySingleSpan} $span - a jQuery object representing the HTML
  *     `span` element to be transformed into a clock. Note that all existing
  *     content within the span will be  will be removed.
  * @param {dictionary} - details of new clock display. See below.
  *
  * @param {string} [tz=Europe/London] - The timezone for the clock.
  * @param {number} [tf=24] - Time format: 12 for 12-hour clock or 24 for 24-hour clock
  * @param {string} [ds=false] - Whether clock displays seconds or not. "True" = display seconds
  * @param {string} [bs=false] - Whether hours/minutes/seconds separator blinks. "True" = cause the separator to blink
  * @param {string} [now] - if provided, sets clock time & disables clock from running
  * @throws {TypeError} An error is thrown when an invalid value is passed for
  *     any of the arguments.
  * @throws {RangeError} A Range Error is thrown when any of the named properties of the passed details object have the correct type, but an invalid value.
  **/
  
  constructor ($aSpan, details) {
    console.log ("WCC: constructing WC instance");
    
    /*
    * A lookup table for validating TZ strings. All valid strings are keys in
    * this table with value `true`.
    */

    this._tzLookup = {};

    var self = this;
    moment.tz.names().forEach(function(tzn){
      self._tzLookup[tzn] = true;
    });
    
   // *************************
    // validate input
    // *************************
    // ----------------------
    // clock span element (required):
    // ----------------------
    if(typeof $aSpan === 'undefined'){
       throw new TypeError('Must have at least one argument (jQuery span)');
    }
    
    this.$span = $aSpan;
    
    // figure out if any details passed in
    // ensure details will always be an object before it is processed

    if(typeof details === 'undefined'){
      details = {};
    }else if(typeof details !== 'object'){
      throw new TypeError('if passed, second argument must be an object');
    }
    
    // initialise all the data attributes: timezone spec, time format, display seconds, blink separators
    // validate any passed values, and use the default for unspecified values
   
    // ----------------------
    // time zone name:
    // ----------------------
    //console.log ("WCC: validate input, check details.tz");
    this.timezone = details.tz;

    // ----------------------
    // time format
    // ----------------------
    //console.log ("WCC: validate input, check details.timeformat");
    this.timeformat = details.timeFormat;

    // ----------------------
    // display seconds
    // ----------------------
    //console.log ("WCC: validate input, check details.displaySeconds");
    this.displayseconds = details.displaySeconds;

    // ----------------------
    // blink separators
    // ----------------------
    //console.log ("WCC: validate input, check details.blinkSeparators");
    this.blink = details.blinkSeparators;

    // ----------------------
    // fixed time
    // ----------------------
    this.fixedTime = details.fixedTime;

   // *************************
   // Configure clock
   // *************************
   console.log ("WCC: configure clock");

    // ---------------------------------
    // initialize a placeholder for the interval ID
    /**
    * When the clock is running, the ID of the interval controlling it,
    * otherwise, 0.
    * @member {integer}
    * @private
    */
    this._intervalId = 0; // will hold the ID for the interval

    // initialise the span
    this._$span.empty().addClass('ddr-worldclock');
    /**
    * The inner span for the hours.
    * @member {jQuerySingleSpan}
    * @private
    */
    this._$hours = $('<span />').addClass('ddr-worldclock-hours');
    this._$span.append(this._$hours);
    /**
    * The inner span for the separator between the hours and minutes.
    * @member {jQuerySingleSpan}
    * @private
    */
    this._$separatorHM = $('<span />').text(':').addClass('ddr-worldclock-separator');
    this._$span.append(this._$separatorHM);
    /**
    * The inner span for the minutes.
    * @member {jQuerySingleSpan}
    * @private
    */
    this._$minutes = $('<span />').addClass('ddr-worldclock-minutes');
    this._$span.append(this._$minutes);

    //console.log ("WCC: add separator");

    // add the MS separator
    /**
    * The inner span for the seconds.
    * @member {jQuerySingleSpan}
    * @private
    */
    this._$separatorMS = $('<span />').text(':').addClass('ddr-worldclock-separator2');
    this._$span.append(this._$separatorMS);

    this._$seconds = $('<span />').addClass('ddr-worldclock-seconds');
    this._$span.append(this._$seconds);

    // The inner span for the AM/PM
    this._$ampm = $('<span />').addClass('ddr-worldclock-ampm');
    this._$span.append(this._$ampm);

    // the inner span for timezone name
    // optional?
    console.log (`WWC: add span for TZ name`);
    this._$tzname = $('<span />').addClass('ddr-worldclock-tzname');
    this._$span.append(this._$tzname);

    // use accessor to set time format. Should over-ride constructor input
    //this.timeformat (12);

    // save a reference to this object into the span
    this._$span.data('ddr-Worldclock', this);

    // start the clock
    console.log ("WCC: start the clock");

    this.startClock();

    console.log ('time format is ' + this._timeformat + ', time zone is ' +
      this._timezone + ', ds is ' + this._displayseconds);

      console.log ("WCC: exiting");

  };  // end of constructor
  
    
  // =============================================================================
  // define the instance/accessor functions
  // =============================================================================
  
  /* ----------------------------------------------------------- */
  /** 
   * JQuery object representing the span containing the clock
   * @type {jQuerySingleSpan}
   * @returns {Object} JQuery object representing the span containing the clock
   * Get clock's span object.
   */
  get $span(){
    return this._$span;
  }

  /* ----------------------------------------------------------- */
  /** 
   * @type {jQuerySingleSpan}
   * @param {Object} JQuery object representing the span containing the clock
   * @throws {TypeError} A type error is thrown if argument is not a jQuery object representing one span.
   * @returns nothing
   */
  set $span($aSpan){
    //console.log ("getSpan: validate input, check 1st arg");
    // make sure we were passed a jQuery object representing exactly one span
    if(!this.isSingleSpan($aSpan)){
      throw new TypeError('the first argument must be a jQuery object representing exactly one span element');
    }

    // make sure the span has not already been initialised as a clock
    if($aSpan.is('.ddr-worldclock')){
      throw new Error('Cannot initialise a World Clock into a span that has already been initialised as a World Clock');
    }

    // save a reference to the span into the object
    /**
    * A jQuery object representing the span containing the clock.
    * @private
    */
    this._$span = $aSpan;
  }

  /* ----------------------------------------------------------- */
  /** 
   * Get timezone label
   * @type {string}
   */
  get timezone(){
    return this._timezone;
  }

  /** 
   * Set timezone label
   * @type {string}
   */ 
  set timezone(tz){
    let tzSet = "";
    if(typeof tz === 'undefined'){
      if(this._$span.data('timezone')){
        // if there is no argument, but
        // there is a data attribute, use it
        tzSet = $span.data('timezone');
      } else {
        tzSet = 'Europe/London';    // default to Greenwich
      }

    // if there is an argument, validate it
    }else{
      if(typeof tz === 'string'){
        if(tz.length > 0){
          tzSet = tz;
        }else{
          throw new RangeError('details.tz cannot be empty');
        }

      }else{
        throw new TypeError("if passed, details.tz must be a non-empty string");
      }
    }
    
    // validate the timezone
    if(!this.isValidTimeZone(tzSet)){
      throw new TypeError('Invalid timezone string: ' + tzSet);
    }
    this._timezone = tzSet;
  }

  /* ----------------------------------------------------------- */
  /** 
   * Get clock time format (12-hour or 24-hour)
   * @type {number}
   */
  get timeformat(){
    return this._timeformat;
  }

  /** 
   * Set clock time format to 12-hour or 24-hour
   * @type {number}
   */
  set timeformat(tf){
    let timeFormat = 0;

    if(typeof tf === 'undefined'){
      if (this._$span.data('timeformat')) {
        // if there is no argument, but
        // there is a data attribute, use it
        timeFormat = Number(this._$span.data('timeformat'));
      } else {
        timeFormat = 24;    // default is display 24-hour clock
      }

    }else{
      // best-effort to convert the number of decimal places to a number
      timeFormat = parseInt(tf);
      if(isNaN(timeFormat)){
        throw new TypeError('if passed, details.timeFormat must be an integer');
      }else{
        if ((timeFormat != 12) && (timeFormat != 24)) {
          throw new RangeError('details.timeFormat must be 24 or 12');
        }
      }
    }
    this._timeformat = timeFormat;
  }
 
 /* ----------------------------------------------------------- */
  /** 
   * Get seconds display flag
   * @type {Boolean|string}
   */
  get displayseconds(){
    return this._displayseconds;
  }

  /** 
  * Set the clock's seconds display on/off.
  * @type {Boolean|string}
  */
  set displayseconds(ds){

    if(typeof ds === 'undefined'){
        if (this._$span.data('displayseconds')) {
          // if there is no argument, but
          // there is a data attribute, use it
          let daInput = this._$span.data('displayseconds');
          //console.log('data attribute found, is type ' + typeof daInput);
          // make sure it's the right type
          if ((typeof daInput) != 'boolean') {
            if ((typeof daInput) != 'string') {
              throw new TypeError('Display seconds parameter must be TRUE or FALSE: ' + daInput);
            } else {// input is string. Validate string
              dsResult = this.isValidTrueFalse(daInput);
              if (dsResult < 0) {
                throw new TypeError('Display seconds parameter must be TRUE or FALSE: ' + daInput);
              } else {
                this._displayseconds = dsResult;
              }
            }
          }
        } else {
          this._displayseconds = false;    // default to not displaying seconds
        }
        
      }else{
        
        // Validate display seconds input
        let dsResult = this.isValidTrueFalse(ds);
        if (dsResult < 0) {
          //console.log ('newStr is >' + newStr + '< dsResult is ' + dsResult);

          throw new TypeError('Display seconds parameter must be TRUE or FALSE: ' + ds);

        } else {
          this._displayseconds = dsResult;    // default to not displaying seconds
        }

      }
  }

  /* ----------------------------------------------------------- */
  /**
   * Get clock's separator blink on/off.
   * @type {Boolean|string}
   */
  get blink(){
    return this._blink;
  }

  /** 
  * Set clock's separator blink on/off.
  * @type {Boolean|string}
   */
  set blink(bs){

    if(typeof bs === 'undefined'){
      if (this._$span.data('blink')) {
        // if there is no argument, but
        // there is a data attribute, use it
        let daInput = this._$span.data('blink');
        //console.log('data attribute found, is type ' + typeof daInput);
        // make sure it's the right type
        if ((typeof daInput) != 'boolean') {
          if ((typeof daInput) != 'string') {
            throw new TypeError('Blink parameter must be TRUE or FALSE: ' + daInput);
          } else {// input is string. Validate string
            dsResult = this.isValidTrueFalse(daInput);
            if (dsResult < 0) {
              throw new TypeError('Blink parameter must be TRUE or FALSE: ' + daInput);
            } else {
              this._blink = dsResult;
            }
          }
        }
      } else {
        this._blink = false;    // default to not displaying seconds
      }
      
    }else{
      
      // Validate display seconds input
      let dsResult = this.isValidTrueFalse(bs);
      if (dsResult < 0) {
        //console.log ('newStr is >' + newStr + '< dsResult is ' + dsResult);

        throw new TypeError('Blink parameter must be TRUE or FALSE: ' + bs);

      } else {
        this._blink = dsResult;    // default to not displaying seconds
      }

    }
  }

/* ----------------------------------------------------------- */
 /**
   * Get clock's fixed time.
   * @type {string}
   */
  get fixedTime(){
    return this._fixedTime;
  }

  /** 
  * Set clock's fixed time.
  * @type {string}
  * @param {string} - clock time to use ('hh:mm')
   */
  set fixedTime(ftString){
    console.log (`SFT: enter set: ${ftString}`);
    if(typeof ftString === 'undefined'){
      console.log (`SFT: ftString is undefined. Use now.`);

      let now = moment().tz(this._timezone);    // get the current time
      //var now = moment('2016-12-19 21:30');
      
      // extract hours & minutes
      this._fixedTime = now.format('HH:mm');
      this._fixedClock = false;
    }else{
      console.log (`SFT: ftString has input.`);

      // Validate input if correct format
      if (!this.isValidTimeString(ftString)) {
      
        throw new TypeError('Fixed time for clock must be a valid string (HH:MM): ' + ftString);

      } else {
        this._fixedTime = ftString;
        this._fixedClock = true;
      }
    }
    console.log ("SFT: exiting");
  }

/* ----------------------------------------------------------- */
  /** 
  * Return WorldClock version string
  * @type {string}
  */
  get version(){
    return "WorldClock class version 1.4, modified 5/24/2020";
  }

  /* ----------------------------------------------------------- */
    /** 
    * Return current clock time
    * @type {string}
    */
    get clockTime(){

      let hh = this._$hours.text();
      let mn = this._$minutes.text();
      return hh+":"+mn;
    }

  // =============================================================================
  // -- Methods for Rendering the Clock --
  // =============================================================================
  /* ----------------------------------------------------------- */
  /** 
  * Render the current time into a given clock.
  * @inner
  * @private
  * @param {Object} clock - a reference to the clock object to be rendered
  */
  renderClock(clock){
      //console.log ("RC: rendering clock");
      //let x = clock.parseTime(clock._fixedTime);
      //console.log (`RC: hour requested is ${x.hour}`);
      var tfString = '';
      var tfAMPM = '';
      let now = {};
      if (clock._fixedClock) {
        // if this is a fixed time clock, use time from fixedTime (which must be local)
        now = moment(clock.parseTime(clock._fixedTime)).tz(clock._timezone);
        //let x = now.format("HH:mm");
        //console.log (`RC: ${x}`);
        console.log ("RC: this clock has fixed time");

      } else {
        // otherwise get the current time
        now = moment().tz(clock._timezone);
        //var now = moment('2016-12-19 21:30');
        //console.log ("RC: this clock has dynamic time");

      }
      // render the current time
      //console.log('timeformat is ' + clock._timeformat + '<<');
      if (clock._timeformat == 12) {
        tfString = 'hh';
        tfAMPM = 'a';
      } else {
        tfString = 'HH';
        tfAMPM = '';
      }
      //console.log('tfString is ' + tfString);
      clock._$hours.text(now.format(tfString));
      clock._$minutes.text(now.format('mm'));

      // update seconds if requested
      if(clock._displayseconds) {
        clock._$seconds.text(now.format('ss'));
        clock._$separatorMS.show();
        clock._$seconds.show();
      } else {
        // hide M/S separator & seconds
        clock._$separatorMS.hide();
        clock._$seconds.hide();
      }
      // put AM/PM
      clock._$ampm.text(now.format(' '+tfAMPM));

      // add the timezone info
      clock._$tzname.text(' '+ clock._timezone);
      
      // blink the separator
      if (clock._blink) {
        if(parseInt(now.format('ss')) %2 == 0){
          $('span.ddr-worldclock-separator', clock._$span).fadeTo(500, 0.2);
          if (clock._displayseconds) {
            $('span.ddr-worldclock-separator2', clock._$span).fadeTo(500, 0.2);
          }
        }else{
          $('span.ddr-worldclock-separator', clock._$span).fadeTo(500, 1);
          if (clock._displayseconds) {
            $('span.ddr-worldclock-separator2', clock._$span).fadeTo(500, 1);
          }

        }
      } else {
        // if no blink, ensure separators are displayed
        $('span.ddr-worldclock-separator', clock._$span).fadeTo(500, 1);
        if (clock._displayseconds) {
          $('span.ddr-worldclock-separator2', clock._$span).fadeTo(500, 1);
        }

      }
  };

  /* ----------------------------------------------------------- */
  /** 
  * Start this clock
  */
  startClock(){
    console.log ("SC: starting clock");
    // if the clock is already started, do nothing
    if(this._intervalId !== 0){
      return;
    }

    // render the current time
    this.renderClock(this);
    console.log ("SC: clock rendered");

    // if this is a fixed time clock, skip starting the timer
    if (!this._fixedClock) {
      // start an interval
      //console.log ("SC: start timer");
      var self = this;
      this._intervalId = setInterval(function(){ self.renderClock(self); }, 1000);

      //console.log ("SC: clock started");
    }
    console.log ("SC: clock started");
  };

  /* ----------------------------------------------------------- */
  /** 
  * Stop this clock
  */
  stopClock(){
    // if the clock is already stopped, do nothing
    if(this._intervalId === 0){
      return;
    }

    console.log ("stop this clock now");
		    // stop the clock
    clearInterval(this._intervalId);
    this._intervalId = 0;
  };

  // =============================================================================
  // === Provide Clock Automation ===
  // =============================================================================
  /* ----------------------------------------------------------- */
  /** 
  * Stop all the clocks in the specified span
  * @param {jQuery} [$containers=$(document)] - jQuery object to search for clocks
  * @throws {TypeError} - error if input parameter is not valid
  */
  stopAllClocks($containers){
    // default the container if none was passed
    if(typeof $containers === 'undefined'){
        $containers = $(document);
    }

    // make sure we have a jQuery object to search within
    if(!this.isjQuery($containers)){
        throw new TypeError('the first argument must be a jQuery object');
    }

    // search the container(s) and stop each clock found
    $('span.ddr-worldclock', $containers).each(function(){
      // stop this clock
      console.log("stopping a clock");

      var aClock = $(this).data('ddr-Worldclock');
      aClock.stopClock();

    });

  };

  /* ----------------------------------------------------------- */
  /** 
  * Start all the clocks in the specified span
  * @param {jQuery} [$containers=$(document)] - jQuery object to search for clocks
  * @throws {TypeError} - error if input parameter is not valid
  */
  startAllClocks($containers){
    // default the container if none was passed
    if(typeof $containers === 'undefined'){
        $containers = $(document);
    }

    // make sure we have a jQuery object to search within
    if(!this.isjQuery($containers)){
        throw new TypeError('the first argument must be a jQuery object');
    }

    // search the container(s) and start each clock found
    $('span.ddr-worldclock', $containers).each(function(){
      // start this clock
      var aClock = $(this).data('ddr-Worldclock');
      aClock.startClock();
    });

  }

  /* ----------------------------------------------------------- */
  /** 
  * Initialise all spans with the class `ddr-worldclock-auto` within a given
  * set of containers.
  * @param {jQuery} [$containers=$(document)] - the container(s) to
  *     search for spans to be automatially transformed into clocks. By
  *     default the entire document is searched.
  * @throws {TypeError} An error is thrown if the first argument is present,
  *     but not a jQuery object.
  */
  autoInitialise($containers){
    // default the container if none was passed
    if(typeof $containers === 'undefined'){
      $containers = $(document);
    }

    // make sure we have a jQuery object to search within
    if(!this.isjQuery($containers)){
      throw new TypeError('the first argument must be a jQuery object');
    }

    // search the container(s) and initialise each clock found
    $('span.ddr-worldclock-auto', $containers).each(function(){
      var $span = $(this);

      // initialise the clock
      new WorldClock($span);

      // remove the auto class to avoid re-initialisation
      $span.removeClass('ddr-worldclock-auto');
    });
  };

//    // add an event handler to automatically initialise clocks when the document
//    // becomes ready
//    $(function(){ ddr.WorldClock.autoInitialise(); });
//    
    
  // =============================================================================
  // define the private helper functions and their needed data structure
  // =============================================================================

  /**
  * A helper function for testing if a given value is a {@link jQuerySingleSpan}
  * @memberof ddr
  * @inner
  * @access private
  * @param {*} $s - the value to test.
  * @returns {boolean} - `true` if the value being tested is a valid
  *     {@link jQuerySingleSpan}, `false` otherwise.
  */
  isSingleSpan($s){
    if(!this.isjQuery($s)){
      return false;
    }
    if($s.length !== 1){
      return false;
    }
    return $s.is('span') ? true : false;
  };

  /**
  * A helper function for testing if a given value is valid
  * true or false
  * @memberof ddr
  * @inner
  * @private
  * @param {*} bv - the value to test.
  * @returns {Number} - 1 if input is value 'true', 0 if input is valid
  *     `false`; -1 otherwise.
  */
   isValidTrueFalse(bv){
        // if argument is a boolean, return value
        if (typeof bv == 'boolean') {
          if (bv) {
            return 1;
          } else {
            return 0;
          }
        } else {
          if (typeof bv == 'string') {
            if ((bv == 'true') || (bv == 'TRUE')) {
              //console.log ('IVTF: input is good and true');
              return 1;
            } else if ((bv == 'false') || (bv == 'FALSE')) {
              //console.log ('IVTF: input is good and false');
              return 0;
            } else {
              //console.log ('IVTF: input is bad: ' + bv);
              return -1;
            }

          } else {
            return -1;   // not boolean or string, return error
          }
        }
    };


  /**
  * A helper function for testing if a given value is valid
  * {@link TimeZoneString}.
  * @memberof ddr
  * @inner
  * @private
  * @param {*} tz - the value to test.
  * @returns {boolean} - `true` if the value being tested is a valid
  *     {@link TimeZoneString}, `false` otherwise.
  */
  isValidTimeZone (tz){
    if(typeof tz !== 'string'){
      return false;
    }
        
    //console.log (`IVTZ: referencing tzLookup. Check ${tz}`);
    return this._tzLookup[tz] ? true : false;
  };

  /**
  * A helper function for testing if a given value is a {@link jQuery}.
  * @memberof ddr
  * @inner
  * @access private
  * @param {*} $s - the value to test.
  * @returns {boolean} - `true` if the value being tested is a valid
  *     {@link jQuery}, `false` otherwise.
  */
  isjQuery(obj){
    if(typeof obj !== 'object'){
      return false;
    }
    if(!(obj instanceof $)){
      return false;
    }
    return true;
  };

  /**
  * A helper function for testing if a given string value is a valid time string.
  * @memberof ddr
  * @inner
  * @access private
  * @param {*} $s - the value to test.
  * @returns {boolean} - `true` if the value being tested is a valid
  *     time string, `false` otherwise.
  */
  isValidTimeString(iStr){
    //console.log ("IVTS: entering");
    // is string?
    if (typeof iStr !== 'string') {
      return false;
    }
    // is of form xx:xx? (regex?)
    const timeRE = /\d\d:\d\d/;    // match 2 digits + colon + 2 digits
    if ((!iStr.match(timeRE)) || (iStr.length != 5)){
      return false;
    }
      
    let tObj = this.parseTime(iStr);
    let hr = tObj.hour;
    let min = tObj.minute;
    
    // hour part in limits (0-23)?
    // minute part in limits (0-59)?
    if ((hr < 0) || (hr > 23) || (min < 0) || (min > 59)) {
      return false;
    }
    return true;
  };
  
  /* ----------------------------------------------------------- */
  /** 
  * A helper function to convert time string into integers.
  * @inner
  * @private
  * @param {string} tStr - string of form 'hh:mm'
  * @returns (Object) - {hour:hh, minute:mm}, parsed from input string
  */
  parseTime(tStr){
    //console.log ("PT: entering");
    //console.log (`PT: type of tStr is ${typeof tStr}`);
    
    let tObj = {hour:0, minute:0};

    // first check input is good
    // is string?
    if (typeof tStr !== 'string') {
      return false;
    }
    // is of form xx:xx? (regex?)
    const timeRE = /\d\d:\d\d/;    // match 2 digits + colon + 2 digits
    if ((!tStr.match(timeRE)) || (tStr.length != 5)){
      return false;
    }

    let timeParts = tStr.split(':'); // returns an array
    tObj.hour = parseInt(timeParts[0]);    // convert to integer
    tObj.minute = parseInt(timeParts[1]);

    //console.log ("PT: exiting");

    return tObj;    // if not, return zeros
  }
  
  
}
