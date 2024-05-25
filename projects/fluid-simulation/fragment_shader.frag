// The fluid simulation implementation here follows the Real-Time Fluid Dynamics paper by Jos Stam.
// http://graphics.cs.cmu.edu/nsp/course/15-464/Fall09/papers/StamFluidforGames.pdf

#version 100
precision mediump float;

#define DEBUG_VELOCITY 0

// Instead of a separate shader program for each rendering pass, we use one program with a uniform
// variable as a pass discriminator.
const int COPY_PASS_KIND = 0;
const int DENSITY_SOURCE_PASS_KIND = 1;
const int DENSITY_DIFFUSION_PASS_KIND = 2;
const int DENSITY_ADVECTION_PASS_KIND = 3;
const int VELOCITY_SOURCE_PASS_KIND = 4;
const int VELOCITY_DIFFUSION_PASS_KIND = 5;
const int VELOCITY_ADVECTION_PASS_KIND = 6;
const int VELOCITY_PROJECTION_STEP_1_PASS_KIND = 7;
const int VELOCITY_PROJECTION_STEP_2_PASS_KIND = 8;
const int VELOCITY_PROJECTION_STEP_3_PASS_KIND = 9;
uniform int pass_kind;

// These textures have semantics depending on the render pass kind. 
uniform sampler2D texture_0;
uniform sampler2D texture_1;

uniform float cell_size;
uniform float diffusion_rate;
uniform float dissipation_rate;
uniform float dt;

varying vec2 cell_center;

vec3 rgb_from_hsv(const vec3 color) {
    // https://stackoverflow.com/a/17897228
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(color.xxx + K.xyz) * 6.0 - K.www);
    return color.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), color.y);
}

vec3 cell(const sampler2D texture, const int i, const int j) {
    // Use a modulo on the coordinate so the grid wraps around itself.
    vec2 texel_coordinate = mod((vec2(i, j) + 0.5) * cell_size, 1.0);
    return texture2D(texture, texel_coordinate).xyz;
}
vec3 cell(const int i, const int j) {
    return cell(texture_0, i, j);
}

vec2 velocity(const vec3 texel) {
    return texel.xy;
}
vec2 velocity(const sampler2D texture, const int i, const int j) {
    return velocity(cell(texture, i, j));
}
vec2 velocity(const int i, const int j) {
    return velocity(cell(i, j));
}

float density(const vec3 texel) {
    return texel.z;
}
float density(const sampler2D texture, const int i, const int j) {
    return density(cell(texture, i, j));
}
float density(const int i, const int j) {
    return density(cell(i, j));
}

vec3 diffusion(const int i, const int j) {
    float grid_size = 1.0 / cell_size;
    float diffusion_factor = diffusion_rate * grid_size * grid_size * dt;
    vec3 pre_diffusion_cell = cell(texture_1, i, j);
    return (
        pre_diffusion_cell +
        diffusion_factor * (cell(i - 1, j) + cell(i + 1, j) + cell(i, j - 1) + cell(i, j + 1))) /
        (1.0 + 4.0 * diffusion_factor);
}

vec3 advection(const int i, const int j) {
    float grid_size = 1.0 / cell_size;
    vec2 backtrace = clamp(vec2(i, j) - velocity(i, j) * grid_size * dt, 0.5, grid_size - 0.5);
    ivec2 ij_0 = ivec2(floor(backtrace));
    ivec2 ij_1 = ij_0 + 1;
    vec2 st_1 = backtrace - vec2(ij_0);
    vec2 st_0 = 1.0 - st_1;
    return st_0.x * (st_0.y * cell(ij_0.x, ij_0.y) + st_1.y * cell(ij_0.x, ij_1.y)) +
        st_1.x * (st_0.y * cell(ij_1.x, ij_0.y) + st_1.y * cell(ij_1.x, ij_1.y));
}

vec2 projection_step_1(const int i, const int j) {
    float div =  -0.5 * cell_size * (
        velocity(i + 1, j).x - velocity(i - 1, j).x +
        velocity(i, j + 1).y - velocity(i, j - 1).y);
    return vec2(div, 0);
}

vec2 projection_step_2(const int i, const int j) {
    float div = cell(i, j).x;
    float p = (
        div + 
        cell(i - 1, j).y + cell(i + 1, j).y + 
        cell(i, j - 1).y + cell(i, j + 1).y) / 4.0;
    return vec2(div, p);
}

vec2 projection_step_3(const int i, const int j) {
    return velocity(i, j) - 0.5 * vec2(
        cell(texture_1, i + 1, j).y - cell(texture_1, i - 1, j).y, 
        cell(texture_1, i, j + 1).y - cell(texture_1, i, j - 1).y) / cell_size;
}

void main() {
    int i = int(cell_center.x / cell_size);
    int j = int(cell_center.y / cell_size);

    if (pass_kind == COPY_PASS_KIND) {
        gl_FragColor = vec4(cell(i, j), 1);
        return;
    }

    if (pass_kind == DENSITY_SOURCE_PASS_KIND) {
        float source = density(texture_1, i, j);
        float new_density = max(density(i, j) + (source - dissipation_rate) * dt, 0.0);
        gl_FragColor = vec4(velocity(i, j), new_density, 1);
        return;
    }

    if (pass_kind == DENSITY_DIFFUSION_PASS_KIND) {
        gl_FragColor = vec4(velocity(i, j), density(diffusion(i, j)), 1);
        return;
    }

    if (pass_kind == DENSITY_ADVECTION_PASS_KIND) {
        gl_FragColor = vec4(velocity(i, j), density(advection(i, j)), 1);
        return;
    }

    if (pass_kind == VELOCITY_SOURCE_PASS_KIND) {
        vec2 source = velocity(texture_1, i, j);
        vec2 new_velocity = velocity(i, j) + source * dt;
        if (length(new_velocity) > 0.001) {
            float new_speed = max(length(new_velocity) - dissipation_rate * dt, 0.0);
            new_velocity = normalize(new_velocity) * new_speed;
        }
        gl_FragColor = vec4(new_velocity, density(i, j), 1);
        return;
    }

    if (pass_kind == VELOCITY_DIFFUSION_PASS_KIND) {
        gl_FragColor = vec4(velocity(diffusion(i, j)), density(i, j), 1);
        return;
    }

    if (pass_kind == VELOCITY_ADVECTION_PASS_KIND) {
        gl_FragColor = vec4(velocity(advection(i, j)), density(i, j), 1);
        return;
    }

    if (pass_kind == VELOCITY_PROJECTION_STEP_1_PASS_KIND) {
        gl_FragColor = vec4(projection_step_1(i, j), 0, 1);
        return;
    }

    if (pass_kind == VELOCITY_PROJECTION_STEP_2_PASS_KIND) {
        gl_FragColor = vec4(projection_step_2(i, j), 0, 1);
        return;
    }

    if (pass_kind == VELOCITY_PROJECTION_STEP_3_PASS_KIND) {
        gl_FragColor = vec4(projection_step_3(i, j), density(i, j), 1);
        return;
    }

#if DEBUG_VELOCITY
    float grid_size = 100.0 * cell_size;
    float hue = (degrees(atan(velocity(i, j).y, velocity(i, j).x)) + 180.0) / 360.0;
    float value = min(length(velocity(i, j)) / grid_size, 1.0);
    gl_FragColor = vec4(rgb_from_hsv(vec3(hue, 1, value)), 1);
#else
    float hue = (degrees(atan(velocity(i, j).y, velocity(i, j).x)) + 180.0) / 360.0;
    float value = density(i, j);
    gl_FragColor = vec4(rgb_from_hsv(vec3(hue, 1, value)), 1);
#endif      
}
