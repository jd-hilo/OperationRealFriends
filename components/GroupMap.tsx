import React from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';
import { theme } from '../constants/theme';

interface UserLocation {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

interface GroupMapProps {
  userLocations: { [key: string]: UserLocation };
  style?: any;
}

const GroupMap: React.FC<GroupMapProps> = ({ userLocations, style }) => (
  <View style={[{ width: 330, height: 130, borderRadius: 24, overflow: 'hidden', marginTop: 8 }, style]}>
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 180,
        longitudeDelta: 360,
      }}
      showsUserLocation={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      zoomEnabled={false}
      scrollEnabled={true}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {Object.entries(userLocations).map(([userId, location]) => (
        <Marker
          key={userId}
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={location.name}
          description={location.country === 'Location not set' ? 'Location not set' : `From ${location.country}`}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
              backgroundColor: location.country === 'Location not set' ? theme.colors.text.secondary : theme.colors.primary,
              borderRadius: 20,
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 1, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 3,
              opacity: location.country === 'Location not set' ? 0.7 : 1,
            }}>
              <MapPin size={16} color="#FFFFFF" />
            </View>
          </View>
        </Marker>
      ))}
    </MapView>
  </View>
);

export default GroupMap; 