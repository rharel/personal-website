export function assert_ok(gl: WebGLRenderingContext) {
    const error_code = gl.getError();
    if (error_code == gl.NO_ERROR) {
        return;
    }

    const error_name = error_code == gl.INVALID_ENUM ? "INVALID_ENUM" :
        error_code == gl.INVALID_VALUE ? "INVALID_VALUE" :
            error_code == gl.INVALID_OPERATION ? "INVALID_OPERATION" :
                error_code == gl.INVALID_FRAMEBUFFER_OPERATION ? "INVALID_FRAMEBUFFER_OPERATION" :
                    error_code == gl.OUT_OF_MEMORY ? "OUT_OF_MEMORY" :
                        error_code == gl.CONTEXT_LOST_WEBGL ? "CONTEXT_LOST_WEBGL" : "unknown";

    throw new Error(`WebGL ${error_name} error (code ${error_code}).`);
}

export function compiled_shader_from_source(gl: WebGLRenderingContext, source: string, shader_type: number): WebGLShader | null {
    const shader_type_name =
        shader_type == gl.VERTEX_SHADER ? "vertex" :
            shader_type == gl.FRAGMENT_SHADER ? "fragment"
                : `type-${shader_type}`;

    const shader = gl.createShader(shader_type);
    if (!shader) {
        console.error(`Failed to create ${shader_type_name} shader.`);
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`Failed to compile ${shader_type_name} shader: ${gl.getShaderInfoLog(shader)}`);
        return null;
    }

    assert_ok(gl);

    return shader;
}

export function attribute_location(gl: WebGLRenderingContext, program: WebGLProgram, name: string): number {
    const location = gl.getAttribLocation(program, name);
    if (location < 0) {
        console.error(`Failed to get location for attribute '${name}'.`);
    }
    return location;
}

export function uniform_location(gl: WebGLRenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation | null {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
        console.error(`Failed to get location for uniform '${name}'.`);
    }
    return location;
}

export function new_rgba_float_texture(gl: WebGLRenderingContext, width: number, height: number, pixels: Float32Array | null): WebGLTexture | null {
    if (pixels && width * height * 4 != pixels.length) {
        console.error("Pixel array size does not match texture dimensions.");
        return null;
    }

    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, pixels);

    assert_ok(gl);

    return texture;
}

export function update_sub_image(gl: WebGLRenderingContext, texture: WebGLTexture, x: number, y: number, width: number, height: number, pixels: Float32Array) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, width, height, gl.RGBA, gl.FLOAT, pixels);
}
