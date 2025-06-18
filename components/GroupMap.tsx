import React from 'react';
import { View, Text } from 'react-native';
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
  checkedIn: boolean;
  currentUserId: string;
}

const GroupMap: React.FC<GroupMapProps> = ({ userLocations, style, checkedIn, currentUserId }) => (
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
      zoomEnabled={checkedIn}
      scrollEnabled={checkedIn}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {Object.entries(userLocations).map(([userId, location]) => {
        if (userId === currentUserId && !checkedIn) return null;
        return (
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
        );
      })}
    </MapView>
    {!checkedIn && (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}>
        <Text style={{ color: '#333', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>Location hidden</Text>
        <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', maxWidth: 220 }}>Tap "Share Location" to display the map for this session.</Text>
      </View>
    )}
  </View>
);

export default GroupMap; 