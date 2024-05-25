#version 100
precision highp float;

attribute vec2 position;
varying vec2 cell_center;

void main() {
    cell_center = (position + 1.0) / 2.0;
    gl_Position = vec4(position, 0, 1);
}
