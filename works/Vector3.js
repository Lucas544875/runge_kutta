function Vector3( x, y, z ) {

  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;

}

Vector3.prototype = {

  constructor: Vector3,

  isVector3: true,

  clone: function () {

    return new this.constructor( this.x, this.y, this.z );

  },

  add: function ( v ) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;

  },

  addScalar: function ( s ) {

    this.x += s;
    this.y += s;
    this.z += s;

    return this;

  },

  addVectors: function ( a, b ) {

    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;

    return this;

  },

  addScaledVector: function ( v, s ) {

    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;

    return this;

  },

  subVectors: function ( a, b ) {

    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;

    return this;

  },

  multiply: function ( v ) {

    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;

    return this;

  },

  multiplyScalar: function ( scalar ) {

    if ( isFinite( scalar ) ) {

      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;

    } else {

      this.x = 0;
      this.y = 0;
      this.z = 0;

    }

    return this;

  },

  multiplyVectors: function ( a, b ) {

    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;

    return this;

  },

  applyMatrix3: function ( m ) {

    var x = this.x, y = this.y, z = this.z;
    var e = m.elements;

    this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
    this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
    this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

    return this;

  },

  divideScalar: function ( scalar ) {

    return this.multiplyScalar( 1 / scalar );

  },

  clamp: function ( min, max ) {

    // This function assumes min < max, if this assumption isn't true it will not operate correctly

    this.x = Math.max( min.x, Math.min( max.x, this.x ) );
    this.y = Math.max( min.y, Math.min( max.y, this.y ) );
    this.z = Math.max( min.z, Math.min( max.z, this.z ) );

    return this;

  },

  clampScalar: function () {

    var min, max;

    return function clampScalar( minVal, maxVal ) {

      if ( min === undefined ) {

        min = new Vector3();
        max = new Vector3();

      }

      min.set( minVal, minVal, minVal );
      max.set( maxVal, maxVal, maxVal );

      return this.clamp( min, max );

    };

  }(),

  clampLength: function ( min, max ) {

    var length = this.length();

    return this.multiplyScalar( Math.max( min, Math.min( max, length ) ) / length );

  },

  floor: function () {

    this.x = Math.floor( this.x );
    this.y = Math.floor( this.y );
    this.z = Math.floor( this.z );

    return this;

  },

  ceil: function () {

    this.x = Math.ceil( this.x );
    this.y = Math.ceil( this.y );
    this.z = Math.ceil( this.z );

    return this;

  },

  round: function () {

    this.x = Math.round( this.x );
    this.y = Math.round( this.y );
    this.z = Math.round( this.z );

    return this;

  },

  roundToZero: function () {

    this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
    this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
    this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );

    return this;

  },

  dot: function ( v ) {

    return this.x * v.x + this.y * v.y + this.z * v.z;

  },

  lengthSq: function () {

    return this.x * this.x + this.y * this.y + this.z * this.z;

  },

  length: function () {

    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

  },

  normalize: function () {

    return this.divideScalar( this.length() );

  },

  lerp: function ( v, alpha ) {

    this.x += ( v.x - this.x ) * alpha;
    this.y += ( v.y - this.y ) * alpha;
    this.z += ( v.z - this.z ) * alpha;

    return this;

  },

  cross: function ( v ) {

    var x = this.x, y = this.y, z = this.z;

    this.x = y * v.z - z * v.y;
    this.y = z * v.x - x * v.z;
    this.z = x * v.y - y * v.x;

    return this;

  },

  equals: function ( v ) {

    return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

  }

};