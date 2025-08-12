import Toast from "react-native-toast-message";

export const customToast = (type: string,text1='',text2='') => {
  Toast.show({
    type: type,
    position: 'top',
    text1: text1,
    text2: text2,
    visibilityTime: 4000,
  });
};