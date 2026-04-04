import React, { useRef } from 'react';
import { extend, useFrame } from '@react-three/fiber';
import { Cylinder, Cone, Torus, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ─── Simplex noise GLSL (shared by all shaders) ───────────────────────────────
const NOISE_GLSL = `
  vec3 _mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 _mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 _permute(vec4 x){return _mod289v4(((x*34.)+1.)*x);}
  vec4 _taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=_mod289v3(i);
    vec4 p=_permute(_permute(_permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=_taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

// ─── FlameMaterial: turbulent gaseous flame with colour gradient ──────────────
const FlameMaterial = shaderMaterial(
  {
    time: 0,
    colorB: new THREE.Color(0.1, 0.2, 1.0),   // bottom/base (blue)
    colorT: new THREE.Color(0.3, 0.45, 1.0),  // tip (lighter blue or orange)
    lum: 0.0,        // 0 = non-luminous(blue), 1 = luminous(orange-yellow)
    opacity: 0.6,
    noiseScale: 1.0,
    rimFalloff: 0.15,
    edgeSoftness: 0.4,
  },
  // vertex
  `
    varying vec2 vUv;
    varying float vElev;
    varying vec3 vViewPos;
    varying vec3 vNorm;
    uniform float time;
    uniform float noiseScale;
    ${NOISE_GLSL}
    void main(){
      vUv=uv; vNorm=normalize(normalMatrix*normal);
      vec3 pos=position;
      float sway=smoothstep(.1,1.,uv.y);
      pos.x+=snoise(vec3(0.,time*2.2,.5))*0.09*sway;
      pos.z+=snoise(vec3(7.3,time*1.7,0.))*0.07*sway;
      float n1=snoise(vec3(pos.x*2.5,pos.y*2.5-time*3.5,pos.z*2.5));
      float n2=snoise(vec3(pos.x*6.,pos.y*6.-time*5.5,pos.z*6.));
      float combined=n1+n2*.35;
      pos+=normal*combined*0.09*smoothstep(0.,.8,uv.y)*noiseScale;
      vElev=combined;
      vec4 mv=viewMatrix*(modelMatrix*vec4(pos,1.)); vViewPos=-mv.xyz;
      gl_Position=projectionMatrix*mv;
    }
  `,
  // fragment
  `
    varying vec2 vUv; varying float vElev; varying vec3 vNorm; varying vec3 vViewPos;
    uniform vec3 colorB; uniform vec3 colorT; uniform float lum;
    uniform float opacity; uniform float rimFalloff; uniform float edgeSoftness;
    void main(){
      float fresnel=dot(normalize(vNorm),normalize(vViewPos));
      float edgeA=smoothstep(0.,edgeSoftness,abs(fresnel));
      float topFade=1.-smoothstep(1.-rimFalloff,1.,vUv.y);
      float baseFade=smoothstep(0.,.08,vUv.y);
      // colour gradient bottom→top
      vec3 col=mix(colorB,colorT,smoothstep(.1,.7,vUv.y));
      // luminous orange overlay
      vec3 lumCol=vec3(1.1,.55,.05);
      col=mix(col,lumCol,smoothstep(.2,.75,vUv.y)*lum);
      // hot-spot from noise
      col=mix(col,colorB*1.9,smoothstep(.15,.7,vElev)*.3*(1.-lum));
      float a=opacity*topFade*baseFade*edgeA;
      gl_FragColor=vec4(col,a);
    }
  `
);

// ─── ImpactMaterial: radial glow at flat-bottom impact ───────────────────────
const ImpactMaterial = shaderMaterial(
  { color: new THREE.Color(1,1,1), opacity: 0.6 },
  `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  `varying vec2 vUv; uniform vec3 color; uniform float opacity;
   void main(){float d=distance(vUv,vec2(.5));float s=1.-smoothstep(0.,.5,d);gl_FragColor=vec4(color,s*opacity);}`
);

// ─── ShimmerMaterial: faint heat-air distortion wisps ────────────────────────
const ShimmerMaterial = shaderMaterial(
  { time: 0 },
  `varying vec2 vUv; varying vec3 vPos; void main(){vUv=uv;vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  `varying vec2 vUv; varying vec3 vPos; uniform float time;
   vec3 _p(vec3 x){return mod(((x*34.)+1.)*x,289.);}
   float sn2(vec2 v){
     const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
     vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
     vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
     vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.);
     vec3 p=_p(_p(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
     vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;
     vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;
     m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
     vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
     return 130.*dot(m,g);
   }
   void main(){
     float n=sn2(vec2(vPos.x*5.,vPos.y*5.-time*2.));
     float a=smoothstep(0.,.5,abs(n))*.1;
     float fade=1.-smoothstep(0.,1.,vUv.y);
     gl_FragColor=vec4(1.,1.,1.,a*fade*.25);
   }`
);

extend({ FlameMaterial, ImpactMaterial, ShimmerMaterial });

// ─────────────────────────────────────────────────────────────────────────────
//  Flame component
//  gasFlow 0-1  : gas supply (controls height/width)
//  airFlow 0-1  : air supply (0=luminous orange, 1=non-luminous blue)
// ─────────────────────────────────────────────────────────────────────────────
const Flame = ({
  isHeating = false,
  baseRadius = 0.8,
  flameTargetY = 3.9,
  apparatusType = 'standard',
  intensity = 1.0,
  gasFlow = 0.6,
  airFlow = 0.8,
  proximity = 0,   // 0=free-burning, 1=fully deformed against apparatus
}) => {
  const outerRef  = useRef();
  const innerRef  = useRef();
  const lumRef    = useRef();
  const spreadRef = useRef();
  const shimRef   = useRef();

  // BURNER_TIP: exact top of the barrel nozzle cap (cap center 3.3, half-height 0.025 → top = 3.325)
  const BURNER_TIP = 3.325;

  // Derived scalars
  const lum   = Math.max(0, Math.min(1, 1.0 - airFlow));
  const gfH   = (0.4 + 0.6 * gasFlow) * intensity;
  const gfW   = (0.5 + 1.2 * gasFlow * gasFlow) * intensity;
  const gfOp  = 0.5 + 0.7 * gasFlow;

  // Free-burning dimensions
  const freeH  = 2.1 * gfH;
  const freeW  = 0.13 * gfW * (1 + 0.35 * lum);
  const innerH = freeH * 0.6;
  const innerW = 0.065 * gfW;

  // Smoothstep on proximity for natural feel
  // smoothstep 3t²-2t³
  const sp = proximity * proximity * (3 - 2 * proximity);
  // Secondary curve that ramps in later (spread appears after stem starts compressing)
  const sp2 = Math.max(0, (proximity - 0.2) / 0.8);
  const sp2s = sp2 * sp2 * (3 - 2 * sp2);

  // Inner cone compresses with proximity too (but stays shorter than outer)
  // At full proximity the inner cone is ~40% of free height
  const innerHCompressed = innerH * (1 - sp * 0.6);
  const innerHFinal = isHeating && sp > 0.01 ? innerHCompressed : innerH;

  // Gradient colours
  const colorB = new THREE.Color(0.1, 0.2, 1.0).lerp(new THREE.Color(0.15, 0.08, 0.7), lum);
  const colorT = new THREE.Color(0.28, 0.42, 1.0).lerp(new THREE.Color(1.0, 0.75, 0.15), lum);

  // ── Animation ──────────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const ff = Math.sin(t*22)*.05 + Math.sin(t*39)*.04 + Math.sin(t*9.1)*.02;
    const breath = 0.9 + Math.sin(t * 4.5) * 0.1;

    if (outerRef.current) {
      outerRef.current.time       = t;
      outerRef.current.opacity    = (0.52 + 0.22*lum)*gfOp + ff*0.4;
      outerRef.current.noiseScale = breath;
    }
    if (innerRef.current) {
      innerRef.current.time       = t;
      innerRef.current.opacity    = 0.95*gfOp + ff;
      innerRef.current.noiseScale = 0.55 + Math.sin(t*7)*0.12;
    }
    if (lumRef.current) {
      lumRef.current.time       = t;
      lumRef.current.opacity    = 0.42*lum*gfOp + ff*0.3;
      lumRef.current.noiseScale = breath * 1.3;
    }
    if (spreadRef.current) {
      spreadRef.current.time       = t;
      spreadRef.current.opacity    = (0.75 + 0.2*lum)*gfOp*sp2s + ff*0.5*sp2s;
      spreadRef.current.noiseScale = breath * 1.5;
    }
    if (shimRef.current) shimRef.current.time = t;
  });

  // ── Compute geometry via smooth interpolation ──────────────────────────────
  const isFlat  = isHeating && (apparatusType === 'beaker' || apparatusType === 'conical');
  const isRound = isHeating && apparatusType === 'round';

  let stemH, stemPosY, spreadGeom;

  if (isHeating && sp > 0.01) {
    if (isFlat) {
      // Target (fully deformed) stem
      const fullSpreadH  = 0.38 * gfH;
      const fullStemTopY = flameTargetY - fullSpreadH;
      const fullStemH    = Math.max(0.01, (fullStemTopY - BURNER_TIP) * gfH);

      // Interpolate stem: free → compressed
      stemH    = freeH * (1 - sp) + fullStemH * sp;
      stemPosY = BURNER_TIP + stemH / 2;

      // Spread cone grows in as proximity increases
      const sBot  = freeW;
      const sTop  = (apparatusType === 'conical' ? baseRadius * 0.9 : baseRadius * 0.85) * gfH;
      const sTopI = sTop * sp2s;   // starts at 0, grows to full
      const yOff  = (flameTargetY - fullSpreadH/2)*gfH + (1 - gfH)*BURNER_TIP;

      spreadGeom = (
        <group>
          {/* Impact glow – fades in */}
          <mesh rotation={[-Math.PI/2,0,0]} position={[0,(flameTargetY-0.015)*gfH+(1-gfH)*BURNER_TIP,0]}>
            <planeGeometry args={[sBot*3.5, sBot*3.5]} />
            <impactMaterial color={lum>0.4?'#ff8800':'#4488ff'} opacity={0.65*gfOp*sp2s} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* Spreading funnel crown – top radius grows with sp2 */}
          <Cylinder args={[sTopI, sBot, fullSpreadH, 32, 1, true]} position={[0, yOff, 0]}>
            <flameMaterial ref={spreadRef} colorB={colorB} colorT={colorT} lum={lum}
              opacity={0.88*gfOp*sp2s} rimFalloff={0.55} edgeSoftness={0.8} noiseScale={1.6*gfH}
              transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </Cylinder>
        </group>
      );

    } else if (isRound) {
      // Target (fully deformed)
      const cupBotY    = flameTargetY - 0.28;
      const cupH       = 0.65 * gfH;
      const sTopY      = Math.max(BURNER_TIP + 0.1, cupBotY);
      const fullStemH  = (sTopY - BURNER_TIP) * gfH;
      const cupTop     = (baseRadius + 0.12) * gfH;

      // Interpolate stem
      stemH    = freeH * (1 - sp) + fullStemH * sp;
      stemPosY = BURNER_TIP + stemH / 2;

      const cupTopI  = cupTop * sp2s;   // grows in
      const cupHI    = cupH   * sp2s;
      const cupYOff  = (sTopY + cupH/2)*gfH + (1-gfH)*BURNER_TIP;

      spreadGeom = cupHI > 0.01 ? (
        <Cylinder args={[cupTopI, freeW, cupHI, 32, 1, true]} position={[0, cupYOff, 0]}>
          <flameMaterial ref={spreadRef} colorB={colorB} colorT={colorT} lum={lum}
            opacity={0.65*gfOp*sp2s} rimFalloff={0.5} edgeSoftness={1.0} noiseScale={1.4*gfH}
            transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </Cylinder>
      ) : null;

    } else {
      // Non-recognised type: just compress stem slightly as a hint
      stemH    = freeH * (1 - sp * 0.3);
      stemPosY = BURNER_TIP + stemH / 2;
      spreadGeom = null;
    }
  } else {
    // Free-burning
    stemH      = freeH;
    stemPosY   = BURNER_TIP + stemH / 2;
    spreadGeom = null;
  }

  return (
    <group>
      {/* ── Outer mantle ── */}
      <Cylinder args={[0.01*gfW, freeW, stemH, 32, 1, true]} position={[0, stemPosY, 0]}>
        <flameMaterial ref={outerRef} colorB={colorB} colorT={colorT} lum={lum}
          opacity={0.58*gfOp} noiseScale={1.0} rimFalloff={0.18} edgeSoftness={0.45}
          transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </Cylinder>

      {/* ── Inner premixed cone ── */}
      <Cylinder args={[0.005*gfW, innerW, innerHFinal, 24, 1, true]} position={[0, BURNER_TIP + innerHFinal/2, 0]}>
        <flameMaterial ref={innerRef}
          colorB={new THREE.Color(0.55, 0.75, 1.0).lerp(new THREE.Color(1.1, 0.9, 0.3), lum * 0.7)}
          colorT={new THREE.Color(0.75, 0.88, 1.0).lerp(new THREE.Color(1.0, 1.0, 0.6), lum * 0.5)}
          lum={lum * 0.4}
          opacity={1.0*gfOp} noiseScale={0.5} rimFalloff={0.12} edgeSoftness={0.28}
          transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </Cylinder>

      {/* ── Luminous orange outer (low airFlow only) ── */}
      {lum > 0.12 && (
        <Cylinder args={[0.018*gfW, freeW*1.35, stemH*0.82, 24, 1, true]} position={[0, BURNER_TIP+stemH*0.82/2, 0]}>
          <flameMaterial ref={lumRef}
            colorB={new THREE.Color(0.75, 0.3, 0.05)} colorT={new THREE.Color(1.0, 0.78, 0.1)} lum={1.0}
            opacity={0.35*lum*gfOp} noiseScale={1.5} rimFalloff={0.32} edgeSoftness={0.7}
            transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </Cylinder>
      )}

      {/* ── Apparatus-specific spread geometry ── */}
      {spreadGeom}

      {/* ── Hot base glow sphere (at burner nozzle) ── */}
      <mesh position={[0, BURNER_TIP, 0]}>
        <sphereGeometry args={[0.055*gfW, 12, 12]} />
        <meshBasicMaterial color="#cce8ff" transparent opacity={0.95*gfOp} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* ── Point light ── */}
      <pointLight position={[0, flameTargetY, 0]} intensity={2.8*gfOp} color={lum>0.4?'#ffaa22':'#66aaff'} distance={4.5} decay={2} />

      {/* ── Heat shimmer above flame ── */}
      <mesh position={[0, BURNER_TIP + stemH + 0.8, 0]}>
        <cylinderGeometry args={[0.42, 0.22, 1.5, 16, 1, true]} />
        <shimmerMaterial ref={shimRef} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  BunsenBurner component
// ─────────────────────────────────────────────────────────────────────────────
const BunsenBurner = ({
  isOn = false,
  isHeating = false,
  baseRadius = 0.8,
  flameTargetY = 3.9,
  apparatusType = 'standard',
  intensity = 1.0,
  flameColor = '#0033cc',
  airFlow = 0.8,
  gasFlow = 0.6,
  proximity = 0,
  ...props
}) => (
  <group {...props}>
    {/* ── Base plate ── */}
    <Cylinder args={[0.9, 1.0, 0.1, 32]} position={[0, 0.05, 0]}>
      <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
    </Cylinder>
    {/* ── Conical base ── */}
    <Cylinder args={[0.5, 0.8, 0.4, 32]} position={[0, 0.3, 0]}>
      <meshStandardMaterial color="#666" metalness={0.7} roughness={0.4} />
    </Cylinder>

    {/* ── Gas inlet tube ── */}
    <group position={[0.6, 0.4, 0]} rotation={[0, 0, -Math.PI/2]}>
      <Cylinder args={[0.08, 0.08, 0.6, 16]}>
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
      </Cylinder>
      <Torus args={[0.08, 0.01, 8, 16]} position={[0, 0.2, 0]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#888" />
      </Torus>
    </group>

    {/* ── Barrel / chimney ── */}
    <Cylinder args={[0.12, 0.12, 3, 32]} position={[0, 1.8, 0]}>
      <meshStandardMaterial color="#e0e0e0" metalness={0.9} roughness={0.1} />
    </Cylinder>
    <Cylinder args={[0.13, 0.13, 0.05, 32]} position={[0, 3.3, 0]}>
      <meshStandardMaterial color="#e0e0e0" metalness={0.9} roughness={0.1} />
    </Cylinder>

    {/* ── Air-regulator collar (brass) ── */}
    <group position={[0, 0.8, 0]}>
      <Cylinder args={[0.14, 0.14, 0.4, 32]}>
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Torus args={[0.14, 0.01, 16, 32]} position={[0, 0.08, 0]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#d4af37" metalness={0.8} />
      </Torus>
      <Torus args={[0.14, 0.01, 16, 32]} position={[0, -0.08, 0]} rotation={[Math.PI/2, 0, 0]}>
        <meshStandardMaterial color="#d4af37" metalness={0.8} />
      </Torus>
    </group>

    {/* ── Flame ── */}
    {isOn && (
      <Flame
        isHeating={isHeating}
        baseRadius={baseRadius}
        flameTargetY={flameTargetY}
        apparatusType={apparatusType}
        intensity={intensity}
        gasFlow={gasFlow}
        airFlow={airFlow}
        proximity={proximity}
      />
    )}

    {/* ── Ambient light contribution ── */}
    {isOn && (
      <pointLight
        position={[0, 3.5, 0]}
        intensity={2 * intensity}
        color={airFlow > 0.5 ? '#4488ff' : '#ff8800'}
        distance={5}
        decay={2}
      />
    )}
  </group>
);

export default BunsenBurner;
