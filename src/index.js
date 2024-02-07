import * as THREE from 'three';
import { GLTFLoader } from '../../../static/three.js/examples/jsm/loaders/GLTFLoader.js';
const KEY_MAPPING = {
    key1: ['q', 'Q', '1'],
    key2: ['w', 'W', '2'],
    key3: ['e', 'E', '3'],
    key4: ['r', 'R', '4'],
    key5: ['t', 'T', '5'],
    key6: ['y', 'Y', '6'],
    key7: ['u', 'U', '7'],
    key8: ['i', 'I', '8'],
    key9: ['o', 'O', '9'],
    key10: ['p', 'P', '0'],
    key11: ['a', 'A', '@'],
    key12: ['s', 'S', '#'],
    key13: ['d', 'D', '$'],
    key14: ['f', 'F', '&'],
    key15: ['g', 'G', '*'],
    key16: ['h', 'H', '('],
    key17: ['j', 'J', ')'],
    key18: ['k', 'K', "'"],
    key19: ['l', 'L', '"'],
    key21: ['z', 'Z', '-'],
    key22: ['x', 'X', '+'],
    key23: ['c', 'C', '='],
    key24: ['v', 'V', '/'],
    key25: ['b', 'B', ';'],
    key26: ['n', 'N', ':'],
    key27: ['m', 'M', '_'],
    key28: [',', ',', '!'],
    key29: ['.', '.', '?'],
    keyspace: [' ', ' ', ' '],
};
const raycaster = new THREE.Raycaster();
const loader = new GLTFLoader();
export default class XRKeys extends THREE.Group {
    constructor(model, keyMaskOffset = 0.00001, hoveredColor = '#666E73', pressedColor = '#ffffff') {
        super();
        this._keyboards = [];
        this._keysetIndex = 0;
        this._isUpperCase = false;
        this._isNumber = false;
        this._text = '';
        this._hoveredKey = null;
        this._tempVec31 = new THREE.Vector3();
        this._tempVec32 = new THREE.Vector3();
        const lowerCaseKeys = model.getObjectByName('lowercase');
        const keysMaterial = new THREE.MeshBasicMaterial({
            map: lowerCaseKeys.material.map,
            transparent: true,
        });
        const upperCaseKeys = model.getObjectByName('uppercase');
        const numbersKeys = model.getObjectByName('number');
        lowerCaseKeys.material = keysMaterial;
        upperCaseKeys.material = keysMaterial;
        numbersKeys.material = keysMaterial;
        upperCaseKeys.visible = false;
        numbersKeys.visible = false;
        this._keyboards.push(lowerCaseKeys, upperCaseKeys, numbersKeys);
        const keymaskMaterial = new THREE.MeshBasicMaterial();
        this._keyMask = model.getObjectByName('shortkeymask');
        this._longKeyMask = model.getObjectByName('longkeymask');
        this._spaceKeyMask = model.getObjectByName('spacemask');
        this._keyMask.material = keymaskMaterial;
        this._longKeyMask.material = keymaskMaterial;
        this._spaceKeyMask.material = keymaskMaterial;
        this._keyMask.position.y = keyMaskOffset;
        this._longKeyMask.position.y = keyMaskOffset;
        this._spaceKeyMask.position.y = keyMaskOffset;
        this._keyMask.visible = false;
        this._longKeyMask.visible = false;
        this._spaceKeyMask.visible = false;
        this._keys = model.children.filter((child) => child.name.startsWith('key'));
        this._hoveredColor = hoveredColor;
        this._pressedColor = pressedColor;
        this.add(...this._keyboards, this._keyMask, this._longKeyMask, this._spaceKeyMask);
    }
    static async create(config = {}) {
        var _a;
        const model = await loader.loadAsync((_a = config.path) !== null && _a !== void 0 ? _a : 'https://www.unpkg.com/xrkeys/dist/xrkeys.glb');
        return new XRKeys(model.scene, config.keyMaskOffset);
    }
    get activeKeyboard() {
        return this._keyboards[this._keysetIndex];
    }
    get activeKeysetIndex() {
        return this._keysetIndex;
    }
    get text() {
        return this._text;
    }
    _updateKeyMask(keyMask, key, pressed) {
        keyMask.position.set(key.position.x, 0.00001, key.position.z);
        keyMask.visible = true;
        keyMask.material.color.set(pressed ? this._pressedColor : this._hoveredColor);
        this._hoveredKey = { name: key.name, pressed };
    }
    update(targetRaySpace, pressed) {
        this._keyMask.visible = false;
        this._longKeyMask.visible = false;
        this._spaceKeyMask.visible = false;
        this._keyboards.forEach((keyboard) => {
            keyboard.visible = false;
            keyboard.position.y = -0.01;
        });
        const activeKeys = this.activeKeyboard;
        activeKeys.visible = true;
        activeKeys.position.y = 0;
        const lastHoveredKey = this._hoveredKey;
        this._hoveredKey = null;
        raycaster.set(targetRaySpace.getWorldPosition(this._tempVec31), targetRaySpace.getWorldDirection(this._tempVec32).negate());
        const intersect = raycaster.intersectObject(activeKeys, true)[0];
        if (intersect) {
            const vec2 = new THREE.Vector2((intersect.uv.x - 0.5) * 0.3495, (intersect.uv.y * 3 - this.activeKeysetIndex - 0.5) * 0.1425);
            this._keys.forEach((key) => {
                if (['keydelete', 'keyenter', 'keyset'].includes(key.name)) {
                    if (Math.abs(key.position.x - vec2.x) < 0.03225 &&
                        Math.abs(key.position.z - vec2.y) < 0.015) {
                        this._updateKeyMask(this._longKeyMask, key, pressed);
                    }
                }
                else if (key.name === 'keyspace') {
                    if (Math.abs(key.position.x - vec2.x) < 0.06675 &&
                        Math.abs(key.position.z - vec2.y) < 0.015) {
                        this._updateKeyMask(this._spaceKeyMask, key, pressed);
                    }
                }
                else if (Math.abs(key.position.x - vec2.x) < 0.015 &&
                    Math.abs(key.position.z - vec2.y) < 0.015) {
                    this._updateKeyMask(this._keyMask, key, pressed);
                }
            });
            if (this._hoveredKey && lastHoveredKey) {
                if (this._hoveredKey.name === lastHoveredKey.name &&
                    this._hoveredKey.pressed &&
                    !lastHoveredKey.pressed) {
                    const mapped = KEY_MAPPING[this._hoveredKey.name];
                    if (mapped) {
                        this._text += mapped[this.activeKeysetIndex];
                        this.dispatchEvent({
                            type: 'keypress',
                            target: this,
                            key: mapped[this.activeKeysetIndex],
                        });
                    }
                    else {
                        switch (this._hoveredKey.name) {
                            case 'keydelete':
                                this._text = this._text.slice(0, -1);
                                this.dispatchEvent({
                                    type: 'keypress',
                                    target: this,
                                    key: 'delete',
                                });
                                break;
                            case 'keyenter':
                                if (this.onEnter) {
                                    this.onEnter(this._text);
                                    this._text = '';
                                }
                                this.dispatchEvent({
                                    type: 'keypress',
                                    target: this,
                                    key: 'enter',
                                });
                                break;
                            case 'key20':
                                if (this._isNumber) {
                                    this._text += '%';
                                    this.dispatchEvent({
                                        type: 'keypress',
                                        target: this,
                                        key: '%',
                                    });
                                }
                                else {
                                    this._isUpperCase = !this._isUpperCase;
                                    this._keysetIndex = this._isUpperCase ? 1 : 0;
                                }
                                break;
                            case 'keyset':
                                if (this._isNumber) {
                                    this._isNumber = false;
                                    this._keysetIndex = this._isUpperCase ? 1 : 0;
                                }
                                else {
                                    this._isNumber = true;
                                    this._keysetIndex = 2;
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        }
    }
}
