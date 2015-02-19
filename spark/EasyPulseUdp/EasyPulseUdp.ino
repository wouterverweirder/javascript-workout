int Num_Samples = 600;
int count = 0;
int ZeroFlag;
int Moving_Average_Num = 10;
int Peak_Threshold_Factor = 80;
int Minimum_Peak_Separation = 50;  // 50*5=250 ms
int Sampling_Time = 5;
int ADC_Value[600];
float ADC_Range;
float Minima, Peak_Magnitude;
float Range;
float Num_Points;
float Sum_Points;
float Peak_Threshold;
float Peak1, Peak2, Peak3;
int Index1, Index2, Index3;
float PR1, PR2;
float Pulse_Rate;

UDP Udp;

void setup() {
  count = 0;
  Serial.begin(115200);
  Udp.begin(12345);
}

void loop() {
  ReadSamples();
  RemoveDC();
  if(ADC_Range < 50) {
    ZeroFlag = 1;
    ZeroData();
  } else ZeroFlag=0;
  ScaleData();
  FilterData();
  ComputeHeartRate();
}

void ReadSamples() {
  for(count = 0; count < Num_Samples; count++) {
    ADC_Value[count] = analogRead(A0);
    delay(5);
  }
}

void RemoveDC() {
  Find_Minima(0);
  Find_Peak(0);
  ADC_Range = Peak_Magnitude-Minima;
  // Subtract DC (minima) 
  for (int i = 0; i < Num_Samples; i++){
     ADC_Value[i] = ADC_Value[i] - Minima;
  }    
  Minima = 0;  // New Minima is zero
}

void Find_Minima(int Num) {
  Minima = 1024;
  for (int m = Num; m < Num_Samples-Num; m++){
      if(Minima > ADC_Value[m]){
        Minima = ADC_Value[m];
      }
  }
}

void Find_Peak(int Num){
  Peak_Magnitude = 0;
  for (int m = Num; m < Num_Samples-Num; m++){
      if(Peak_Magnitude < ADC_Value[m]){
        Peak_Magnitude = ADC_Value[m];
     }
  }
}

void ZeroData(){
  for (int i = 0; i < Num_Samples; i++){
     ADC_Value[i] = 0;
  }
}

void ScaleData(){
  // Find peak value
  Find_Peak(0);
  Range = Peak_Magnitude - Minima;
  // Sclae from 1 to 1023 
  for (int i = 0; i < Num_Samples; i++){
     ADC_Value[i] = 1 + ((ADC_Value[i]-Minima)*1022)/Range;
     
  }
  Find_Peak(0);
  Find_Minima(0);  
}

void FilterData(){
  Num_Points = 2*Moving_Average_Num+1;
  for (int i = Moving_Average_Num; i < Num_Samples-Moving_Average_Num; i++){
    Sum_Points = 0;
    for(int k =0; k < Num_Points; k++){   
      Sum_Points = Sum_Points + ADC_Value[i-Moving_Average_Num+k]; 
    }    
    ADC_Value[i] = Sum_Points/Num_Points; 
  } 
  Find_Peak(Moving_Average_Num);
  Find_Minima(Moving_Average_Num); 
}

void ComputeHeartRate(){
  // Detect Peak magnitude and minima
  Find_Peak(Moving_Average_Num);
  Find_Minima(Moving_Average_Num);
  //println("Peak Magnitude3= "+ Peak_Magnitude + ", Minima = "+ Minima); 
  Range = Peak_Magnitude - Minima;
  Peak_Threshold = Peak_Magnitude*Peak_Threshold_Factor;
  Peak_Threshold = Peak_Threshold/100;
  // Now detect three successive peaks 
  Peak1 = 0;
  Peak2 = 0;
  Peak3 = 0;
  Index1 = 0;
  Index2 = 0;
  Index3 = 0;
  // Find first peak
  for (int j = Moving_Average_Num; j < Num_Samples-Moving_Average_Num; j++){
      if(ADC_Value[j] >= ADC_Value[j-1] && ADC_Value[j] > ADC_Value[j+1] && 
         ADC_Value[j] > Peak_Threshold && Peak1 == 0){
           Peak1 = ADC_Value[j];
           Index1 = j; 
      }
      // Search for second peak which is at least 10 sample time far
      if(Peak1 > 0 && j > (Index1+Minimum_Peak_Separation) && Peak2 == 0){
         if(ADC_Value[j] >= ADC_Value[j-1] && ADC_Value[j] > ADC_Value[j+1] && 
         ADC_Value[j] > Peak_Threshold){
            Peak2 = ADC_Value[j];
            Index2 = j; 
         } 
      } // Peak1 > 0
      
      // Search for the third peak which is at least 10 sample time far
      if(Peak2 > 0 && j > (Index2+Minimum_Peak_Separation) && Peak3 == 0){
         if(ADC_Value[j] >= ADC_Value[j-1] && ADC_Value[j] > ADC_Value[j+1] && 
         ADC_Value[j] > Peak_Threshold){
            Peak3 = ADC_Value[j];
            Index3 = j; 
         } 
      } // Peak2 > 0
    
  }  
 PR1 = (Index2-Index1)*Sampling_Time; // In milliseconds
 PR2 = (Index3-Index2)*Sampling_Time;
 Serial.print("PR1 = ");
 Serial.print(PR1);
 Serial.print(", PR2 = ");
 Serial.println(PR2);
 if(PR1 > 0 && abs(PR1-PR2) < 100){
    Pulse_Rate = (PR1+PR2)/2;
    Pulse_Rate = 60000/Pulse_Rate; // In BPM
    Serial.print("Index2= ");
    Serial.print(Index2);
    Serial.print(", Index1 = ");
    Serial.print(Index1);
    Serial.print(", PulseRate= ");
    Serial.println(Pulse_Rate); 
    Serial.print("Peak Magnitude= ");
    Serial.print(Peak_Magnitude);
    Serial.print(", Minima = ");
    Serial.println(Minima);
    sendDataToNode('B', Pulse_Rate);
 }
}

void sendDataToNode(char symbol, int data ){
  //send it over udp
  IPAddress ipAddress = WiFi.gatewayIP();
  Udp.beginPacket(ipAddress, 1234);

  String str = Spark.deviceID() + ";" + symbol + ";" + data;
  int str_len = str.length() + 1; 
  char char_array[str_len];
  str.toCharArray(char_array, str_len);
  Udp.write((const uint8_t*)char_array, str_len);

  Udp.endPacket();
}
