function ModalContent({
  setIsModalVisible,
  placeName,
  setPlaceName,
  placeContent,
  setPlaceContent,
  placeCoords
}: {
  setIsModalVisible: React.Dispatch<SetStateAction<boolean>>;
  placeName: string;
  setPlaceName: React.Dispatch<SetStateAction<string>>;
  placeContent: string;
  setPlaceContent: React.Dispatch<SetStateAction<string>>;
  placeCoords: {
    longitude: number | null;
    latitude: number | null;
  };
}) {
  const mutation = useCreatePlace();

  function addNewPlaceToMap() {
    if (placeCoords.longitude === null || placeCoords.latitude === null) {
      showToast({
        message: "Something went wrong with latitude and longitude"
      });
      return;
    }

    mutation.mutate(
      {
        name: placeName,
        content: placeContent,
        location: `POINT(${placeCoords.longitude} ${placeCoords.latitude})`
      },
      {
        onSuccess: () => {
          showToast({
            message: "Your new place was successfully created!",
            duration: Toast.durations.SHORT
          });

          setPlaceName("");
          setPlaceContent("");

          setIsModalVisible(false);
        }
      }
    );
  }

  return (
    <>
      <AntDesign
        onPress={() => {
          setIsModalVisible(false);
          setPlaceName("");
          setPlaceContent("");
        }}
        name="close"
        size={48}
        color="#975FA5"
      />
      <Text style={styles.modalText}>Name your new place</Text>
      <Input
        label="Name"
        value={placeName}
        onChangeText={setPlaceName}
        wrapperStyles={styles.inputWrapper}
      />
      <Input
        label="Description"
        value={placeContent}
        onChangeText={setPlaceContent}
        wrapperStyles={styles.inputWrapper}
        multiline
        numberOfLines={5}
        textarea
      />
      <MyButton
        title="Add to my map"
        width={"100%"}
        onPress={addNewPlaceToMap}
      />
    </>
  );
}

export default function HomeScreen({ route, navigation }: HomeScreenProps) {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | unknown>(null);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [placeCoords, setPlaceCoords] = useState<{
    longitude: number | null;
    latitude: number | null;
  }>({ longitude: null, latitude: null });
  const [placeName, setPlaceName] = useState("");
  const [placeContent, setPlaceContent] = useState("");
  const { data: placesList } = useFetchPlaces();

  useEffect(() => {
    async function setUserPosition() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error: unknown) {
        setErrorMsg(error);
      } finally {
        setIsMapLoaded(true);
      }
    }

    void setUserPosition();
  }, []);

  const { fontsLoaded, isCredentialsChecked } = route.params;

  const onLayoutRootView = useCallback(async () => {
    if (
      fontsLoaded &&
      isCredentialsChecked &&
      isMapLoaded &&
      location != null
    ) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isCredentialsChecked, isMapLoaded, location]);

  function createPlaceHandler(event: LongPressEvent) {
    const { coordinate } = event.nativeEvent;
    setPlaceCoords(coordinate);
    setIsModalVisible(true);
  }

  if (typeof errorMsg === "string") {
    return (
      <SafeAreaView style={styles.container}>
        <Text>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  if (location === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Cannot get information about your location</Text>
      </SafeAreaView>
    );
  }

  function openPlaceInformation(placeId: number) {
    navigation.navigate("Place", {
      placeId
    });
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <MapView
        style={styles.map}
        onLongPress={createPlaceHandler}
        initialRegion={{
          longitude: location?.coords.longitude,
          latitude: location?.coords.latitude,
          longitudeDelta: 0.01,
          latitudeDelta: 0.01
        }}
      >
        {placesList?.map((place: Place) => {
          const [longitude, latitude] = place.location
            .replace(/POINT\(|\)/g, "")
            .split(" ");

          return (
            <MyMapMarker
              key={place.id}
              placeId={place.id}
              longitude={+longitude}
              latitude={+latitude}
              placeName={place.name}
              onPress={() => {
                openPlaceInformation(place.id);
              }}
            />
          );
        })}
      </MapView>
      <Modal
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={() => {
          setIsModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={styles.modalSafeAreaView}>
            <ModalContent
              setIsModalVisible={setIsModalVisible}
              placeName={placeName}
              setPlaceName={setPlaceName}
              placeContent={placeContent}
              setPlaceContent={setPlaceContent}
              placeCoords={placeCoords}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  modalKeyboardAvoidingView: {
    flex: 1,
    paddingHorizontal: 40
  },
  modalSafeAreaView: {
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
    position: "relative"
  },
  map: {
    width: "100%",
    height: "100%"
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  textWrapper: {
    textAlign: "center"
  },
  buttonsWrapper: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  modalText: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 18,
    fontWeight: "500",
    color: "#4B4B4B"
  },
  inputWrapper: {
    marginBottom: 16
  }
});
