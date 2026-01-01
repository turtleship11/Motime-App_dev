import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import LoginScreen from '../LoginScreen'; // LoginScreen import

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();

  // 초기 로딩 중이면 아무 것도 안 보여줌
  if (isLoading) return null;

  // 로그인 안 된 경우 LoginScreen 렌더링 (탭 바 유지)
  if (!user) {
    return (
      <View style={{ flex: 1 }}>
        <LoginScreen />
      </View>
    );
  }

  // 로그인 된 경우 프로필 화면
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#fff', dark: '#000' }}
      headerImage={
        <View
          style={{
           width: '100%',
            height: 100,          // 헤더 전체 높이 지정
            alignItems: 'center',
            justifyContent: 'flex-end', // 이미지 + 텍스트 하단 정렬
            paddingBottom: 0,
          }}
        >
          {/* 프로필 사진 */}
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=3' }} // 임시 이미지
            style={{ width: 80, height: 80, borderRadius: 60 }}
            resizeMode="cover"
          />
        </View>
      }
    >
      <View style={{ padding: 24 }}>
        <View style={styles.infoBox}>
          <Text style={styles.label}>현재 로그인 계정</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity
          onPress={async () => {
            await logout(); // 로그아웃 후 user=null → 자동으로 LoginScreen 렌더링
          }}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
