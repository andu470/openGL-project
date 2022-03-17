#version 410 core

in vec3 fNormal;
in vec4 fPosEye;
in vec2 fTexCoords;
in vec4 fragPosLightSpace;
uniform sampler2D shadowMap;
out vec4 fColor;

//lighting
uniform	vec3 lightDir;
uniform	vec3 lightColor;

//texture
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;

// fog
uniform int foginit;
uniform float fogDensity;

// point light
uniform mat4 view;
uniform int pointinit;
uniform vec3 lightPos1;
float constant = 1.0f;
float linear = 0.00225f;
float quadratic = 0.00375;

vec3 ambient;
float ambientStrength = 0.2f;
vec3 diffuse;
vec3 specular;
float specularStrength = 0.5f;
float shininess = 32.0f;


float computeShadow()
{
	// perform perspective divide
	vec3 normalizedCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
	if (normalizedCoords.z > 1.0f)
		return 0.0f;

	// Transform to [0,1] range
	normalizedCoords = normalizedCoords * 0.5 + 0.5;
	// Get closest depth value from light's perspective
	float closestDepth = texture(shadowMap, normalizedCoords.xy).r;
	// Get depth of current fragment from light's perspective
	float currentDepth = normalizedCoords.z;
	// Check whether current frag pos is in shadow
	float bias = 0.005f;
	float shadow = currentDepth -bias > closestDepth ? 1.0f:0.0f;

	return shadow;

}


void computeLightComponents()
{		
	vec3 cameraPosEye = vec3(0.0f);//in eye coordinates, the viewer is situated at the origin
	
	//transform normal
	vec3 normalEye = normalize(fNormal);	
	
	//compute light direction
	vec3 lightDirN = normalize(lightDir);
	
	//compute view direction 
	vec3 viewDirN = normalize(cameraPosEye - fPosEye.xyz);
		
	//compute ambient light
	ambient = ambientStrength * lightColor;
	
	//compute diffuse light
	diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;
	
	//compute specular light
	vec3 reflection = reflect(-lightDirN, normalEye);
	float specCoeff = pow(max(dot(viewDirN, reflection), 0.0f), shininess);
	specular = specularStrength * specCoeff * lightColor;
	
}

// point light
vec3 computePointLight(vec4 lightPosEye)
{
	vec3 cameraPosEye = vec3(0.0f);
	vec3 normalEye = normalize(fNormal);
	vec3 lightDirN = normalize(lightPosEye.xyz - fPosEye.xyz);
	vec3 viewDirN = normalize(cameraPosEye - fPosEye.xyz);
	vec3 ambient = ambientStrength * lightColor;
	vec3 diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;
	vec3 halfVector = normalize(lightDirN + viewDirN);
	vec3 reflection = reflect(-lightDirN, normalEye);
	float specCoeff = pow(max(dot(normalEye, halfVector), 0.0f), shininess);
	vec3 specular = specularStrength * specCoeff * lightColor;
	float distance = length(lightPosEye.xyz - fPosEye.xyz);
	float att = 1.0f / (constant + linear * distance + quadratic * distance * distance);
	return (ambient + diffuse + specular) * att * vec3(2.0f,2.0f,2.0f);
}

float computeFog()
{

 float fragmentDistance = length(fPosEye);
 float fogFactor = exp(-pow(fragmentDistance * fogDensity, 2));

 return clamp(fogFactor, 0.0f, 1.0f);
}

void main() 
{
	computeLightComponents();
	
	vec3 baseColor = vec3(0.9f, 0.35f, 0.0f);//orange
	
	ambient *= texture(diffuseTexture, fTexCoords).rgb;
	diffuse *= texture(diffuseTexture, fTexCoords).rgb;
	specular *= texture(specularTexture, fTexCoords).rgb;

	vec3 light = ambient + diffuse + specular;
	// pointlight
	if (pointinit == 1){
		vec4 lightPosEye1 = view * vec4(lightPos1, 1.0f);
		light += computePointLight(lightPosEye1);
	
		//vec4 diffuseColor = texture(diffuseTexture, fTexCoords);
	}

	float shadow = computeShadow();
	vec3 color = min((ambient + (1.0f - shadow)*diffuse) + (1.0f - shadow)*specular, 1.0f);
    	
	float fogFactor = computeFog();
	vec4 fogColor = vec4(0.5f, 0.5f, 0.5f, 1.0f);
    
	vec4 colorWithShadow = vec4(color,1.0f);
    	if ( foginit == 0)
	{

		//fColor = min(vec4(color,1.0f), 1.0f);
		fColor = min(colorWithShadow * vec4(light, 1.0f), 1.0f);
	}
	else
	{
 
		//fColor = mix(fogColor, vec4(color, 1.0f), fogFactor);
		fColor = mix(fogColor, min(colorWithShadow * vec4(light, 1.0f), 1.0f), fogFactor);
	}
    
}