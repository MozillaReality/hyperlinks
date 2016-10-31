/* globals AFRAME */
(function () {
  var registerComponent = function () {
    if (typeof AFRAME === 'undefined') {
      throw new Error('Component attempted to register before AFRAME ' +
        'was available.');
    }

    /**
     * Hyperlink component for A-Frame.
     */
    AFRAME.registerComponent('href', {
      schema: {
        default: ''
      },

      /**
       * Called once when component is attached.
       */
      init: function () {
        this.handler = this.handler.bind(this);
        this.el.addEventListener('click', this.handler);
        this.el.addEventListener('gripdown', this.handler);
        this.setupHighlight();
      },

      /**
       * Called when component is removed.
       */
      remove: function () {
        this.el.removeEventListener('click', this.handler);
        this.el.removeEventListener('gripdown', this.handler);
      },

      handler: function () {
        var url = this.data;
        this.el.emit('navigate', url);
        window.location.href = url;
      },

      setupHighlight: function () {
        // clone mesh and setup highlighter material
        var mesh = this.el.object3DMap.mesh;
        var clone = mesh.clone();
        clone.material = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0.5
        });
        clone.scale.set(1.2, 1.2, 1.2);
        clone.visible = false;
        mesh.parent.add(clone);

        // toggle highlighter on mouse events
        this.el.addEventListener('mouseenter', function (e) {
          clone.visible = true;
        })

        this.el.addEventListener('mouseleave', function (e) {
          clone.visible = false;
        });
      }
    });
  };

  if (!navigator.getVRDisplays) {
    return;
  }

  var vrDisplay;

  var hasInit = false;
  var scene;
  var wasPresenting = false;

  var whenSceneReady = (scene, callback) => {
    if (scene.hasLoaded) {
      callback();
    } else {
      scene.addEventListener('loaded', callback);
    }
  };

  var initScene = () => {
    if (hasInit) {
      return;
    }

    scene = document.querySelector('a-scene');
    if (!scene) {
      return;
    }

    hasInit = true;

    whenSceneReady(scene, () => {
      navigator.getVRDisplays().then(displays => {
        if (!displays.length) { return; }
        vrDisplay = displays[0];
      });
      autoEnterVR();
      scene.addEventListener('enter-vr', function () {
        localStorage.vrPresenting = true;
      });
      scene.addEventListener('exit-vr', function () {
        localStorage.vrPresenting = wasPresenting;
      });
    });
  };

  var autoEnterVR = () => {
    if (localStorage.vrPresenting !== 'true') {
      return;
    }

    whenSceneReady(scene, enterVR);
  };

  var enterVR = () => {
    return scene.enterVR();
  };

  var navDuringVR = () => {
    wasPresenting = !!(vrDisplay && vrDisplay.isPresenting);
    if (wasPresenting) {
      localStorage.vrPresenting = wasPresenting;
    }
    return scene.exitVR();
  };

  registerComponent();
  initScene();
  window.addEventListener('load', initScene);
  window.addEventListener('beforeunload', navDuringVR);
})();
