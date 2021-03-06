#version 430 core

layout(location = 0) noperspective in vec2 vTexCoords;

layout(location = 0) out vec4 fColor;

uniform int uWorldRotation;
uniform int uTickNumber;

uniform int uSpriteID;
uniform int uRotation;
uniform bool uAnim;

uniform sampler2DArray uTexture[32];

vec4 getTexel( uint spriteID, uint rot, uint animFrame )
{
	uint absoluteId = ( spriteID + animFrame ) * 4;
	uint tex = absoluteId / 2048;
	uint localBaseId = absoluteId % 2048;
	uint localID = localBaseId + rot;
	
	ivec3 samplePos = ivec3( vTexCoords.x * 32, vTexCoords.y * 64, localID);

	// Need to unroll each access to texelFetch with a different element from uTexture into a distinct instruction
	// Otherwise we are triggering a bug on AMD GPUs, where threads start sampling from the wrong texture
	#define B(X) case X: return texelFetch( uTexture[X], samplePos, 0);
	#define C(X) B(X) B(X+1) B(X+2) B(X+3)
	#define D(X) C(X) C(X+4) C(X+8) C(X+12)
	switch(tex)
	{
		D(0)
		D(16)
	}
	#undef D
	#undef C
	#undef B
}

void main()
{
	uint animFrame = 0;
	if( uAnim )
	{
		animFrame = ( uTickNumber / 10 ) % 4;
	}
	
	int rot = ( uRotation + uWorldRotation ) % 4;
	vec4 texel = vec4(0.0);
	
	texel = getTexel( uSpriteID, rot, animFrame ); // TODO add anim 
	
	if( length( texel.rgba ) < 0.1 || texel.a < 0.1 ) 
	{
		discard;
	}
	
	
	
	fColor = texel;
}