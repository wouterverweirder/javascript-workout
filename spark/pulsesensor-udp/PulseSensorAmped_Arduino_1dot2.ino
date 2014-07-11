/*
>> Pulse Sensor Amped 1.2 <<
This code is for Pulse Sensor Amped by Joel Murphy and Yury Gitman
    www.pulsesensor.com 
    >>> Pulse Sensor purple wire goes to Analog Pin A2 (see Interrupt.h for details) <<<
  
Pulse Sensor sample aquisition and processing happens in the background via a hardware Timer interrupt. 2mS sample rate.
PWM on selectable pins A0 and A1 will not work when using this code, because the first allocated timer is TIMR2!
The following variables are automatically updated:
Signal :    int that holds the analog signal data straight from the sensor. updated every 2mS.
IBI  :      int that holds the time interval between beats. 2mS resolution.
BPM  :      int that holds the heart rate value, derived every beat, from averaging previous 10 IBI values.
QS  :       boolean that is made true whenever Pulse is found and BPM is updated. User must reset.
Pulse :     boolean that is true when a heartbeat is sensed then false in time with pin13 LED going out.

This code is designed with output serial data to Processing sketch "PulseSensorAmped_Processing-xx"
The Processing sketch is a simple data visualizer. 
All the work to find the heartbeat and determine the heartrate happens in the code below.
Pin D7 LED (onboard LED) will blink with heartbeat.
If you want to use pin D7 for something else, specifiy different pin in Interrupt.h
Check here for detailed code walkthrough:
http://pulsesensor.myshopify.com/pages/pulse-sensor-amped-arduino-v1dot1

Code Version 1.2 by Joel Murphy & Yury Gitman  Spring 2013
This update fixes the firstBeat and secondBeat flag usage so that realistic BPM is reported.

>>> Adapted for Spark Core by Paul Kourany, May 2014 <<<

*/
#include "SparkIntervalTimer.h"
void interruptSetup(void);

extern int pulsePin;
extern int blinkPin;
extern volatile int BPM;
extern volatile int Signal;
extern volatile int IBI;
extern volatile boolean Pulse;
extern volatile boolean QS;

UDP Udp;

void setup(){
  pinMode(blinkPin,OUTPUT);         // pin that will blink to your heartbeat!
  Serial.begin(115200);             // we agree to talk fast!
  Udp.begin(12345);
  interruptSetup();                 // sets up to read Pulse Sensor signal every 2mS 
   // UN-COMMENT THE NEXT LINE IF YOU ARE POWERING The Pulse Sensor AT LOW VOLTAGE, 
   // AND APPLY THAT VOLTAGE TO THE A-REF PIN
   //analogReference(EXTERNAL);   
}



void loop(){
  if (QS == true){                       // Quantified Self flag is true when arduino finds a heartbeat
        sendDataToProcessing('B',BPM);   // send heart rate with a 'B' prefix
        QS = false;                      // reset the Quantified Self flag for next time    
     }
  
  delay(20);                             //  take a break
}


void sendDataToProcessing(char symbol, int data ){
  //send it over udp
  IPAddress ipAddress = Network.gatewayIP();
  Udp.beginPacket(ipAddress, 1234);

  String str = Spark.deviceID() + ";" + symbol + ";" + data;
  int str_len = str.length() + 1; 
  char char_array[str_len];
  str.toCharArray(char_array, str_len);
  Udp.write((const uint8_t*)char_array, str_len);

  Udp.endPacket();
}